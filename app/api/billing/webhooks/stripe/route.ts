import {
  handleStripeCheckoutCompleted,
  handleStripeInvoicePaymentFailed,
  handleStripeInvoicePaymentSucceeded,
  handleStripeSubscriptionDeleted,
  handleStripeSubscriptionUpdated,
} from "@/lib/billing/stripe-handlers";
import { claimWebhookEvent } from "@/lib/billing/webhook-events";
import { initStripeClient } from "@/lib/billing/stripe";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 },
      );
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error("STRIPE_WEBHOOK_SECRET not configured");
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 },
      );
    }

    const stripeClient = initStripeClient();
    const event = stripeClient
      .getStripeInstance()
      .webhooks.constructEvent(body, signature, webhookSecret);

    const supabase = createServiceRoleClient();
    const shouldProcess = await claimWebhookEvent(
      supabase,
      "stripe",
      event.id,
    );

    if (!shouldProcess) {
      return NextResponse.json({ received: true, duplicate: true });
    }

    switch (event.type) {
      case "checkout.session.completed":
        await handleStripeCheckoutCompleted(
          supabase,
          event.data.object as Parameters<
            typeof handleStripeCheckoutCompleted
          >[1],
        );
        break;

      case "customer.subscription.updated":
        await handleStripeSubscriptionUpdated(
          supabase,
          event.data.object as Parameters<
            typeof handleStripeSubscriptionUpdated
          >[1],
        );
        break;

      case "customer.subscription.deleted":
        await handleStripeSubscriptionDeleted(
          supabase,
          event.data.object as Parameters<
            typeof handleStripeSubscriptionDeleted
          >[1],
        );
        break;

      case "invoice.payment_succeeded":
        await handleStripeInvoicePaymentSucceeded(
          supabase,
          event.data.object as Parameters<
            typeof handleStripeInvoicePaymentSucceeded
          >[1],
        );
        break;

      case "invoice.payment_failed":
        await handleStripeInvoicePaymentFailed(
          supabase,
          event.data.object as Parameters<
            typeof handleStripeInvoicePaymentFailed
          >[1],
        );
        break;

      default:
        console.log(`Unhandled Stripe event type: ${event.type}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("Stripe webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing error" },
      { status: 500 },
    );
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const testMode = url.searchParams.get("test");

  if (testMode !== "true") {
    return NextResponse.json({ error: "Test mode disabled" }, { status: 403 });
  }

  return NextResponse.json({
    message: "Stripe webhook endpoint is ready",
    environment: process.env.NODE_ENV,
  });
}
