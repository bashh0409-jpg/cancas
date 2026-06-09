import { createClient } from "@/lib/supabase/server";
import { initStripeClient } from "@/lib/billing/stripe";
import {
  updateSubscription,
  getUserSubscription,
} from "@/lib/subscriptions/repository";
import { NextResponse } from "next/server";
import Stripe from "stripe";

/**
 * Stripe Webhook Handler
 * Processes subscription events from Stripe
 * POST /api/billing/webhooks/stripe
 */
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

    const stripeClient = initStripeClient();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error("STRIPE_WEBHOOK_SECRET not configured");
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 },
      );
    }

    // Verify webhook signature
    const event = stripeClient
      .getStripeInstance()
      .webhooks.constructEvent(body, signature, webhookSecret);

    if (!event) {
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 401 },
      );
    }

    const supabase = await createClient();

    // Handle different Stripe events
    switch (event.type) {
      case "customer.subscription.updated": {
        type StripeSubscriptionEventObject = Stripe.Subscription & {
          current_period_start?: number | null;
          current_period_end?: number | null;
        };

        const subscription = event.data.object as StripeSubscriptionEventObject;
        const userId = subscription.metadata?.userId;

        if (!userId) {
          console.warn("Subscription update missing userId metadata");
          break;
        }

        const currentPeriodStart = subscription.current_period_start
          ? new Date(subscription.current_period_start * 1000).toISOString()
          : undefined;
        const currentPeriodEnd = subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : undefined;

        const updatePayload: Parameters<typeof updateSubscription>[2] = {
          provider_subscription_id: subscription.id,
          cancel_at_period_end: subscription.cancel_at_period_end,
          metadata: {
            lastWebhookAt: new Date().toISOString(),
          },
        };

        if (currentPeriodStart) {
          updatePayload.current_period_start = currentPeriodStart;
        }
        if (currentPeriodEnd) {
          updatePayload.current_period_end = currentPeriodEnd;
        }

        await updateSubscription(supabase, userId, updatePayload);

        console.log(`Stripe subscription updated: ${subscription.id}`);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;

        if (!userId) {
          console.warn("Subscription deletion missing userId metadata");
          break;
        }

        await updateSubscription(supabase, userId, {
          status: "canceled",
          canceled_at: new Date().toISOString(),
          metadata: {
            canceledViaWebhook: true,
            lastWebhookAt: new Date().toISOString(),
          },
        });

        console.log(`Stripe subscription canceled: ${subscription.id}`);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        // Update subscription status to active if payment succeeded
        const subscription =
          invoice.parent?.subscription_details?.subscription as string | null;
        if (subscription) {
          // Find user by subscription in database
          const { data: subs } = await supabase
            .from("user_subscriptions")
            .select("user_id")
            .eq("provider_subscription_id", subscription)
            .single();

          if (subs) {
            await updateSubscription(supabase, subs.user_id, {
              status: "active",
              metadata: {
                lastPaymentSucceeded: new Date().toISOString(),
              },
            });
          }
        }

        console.log(`Stripe invoice paid: ${invoice.id}`);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscription =
          invoice.parent?.subscription_details?.subscription as string | null;

        if (subscription) {
          const { data: subs } = await supabase
            .from("user_subscriptions")
            .select("user_id")
            .eq("provider_subscription_id", subscription)
            .single();

          if (subs) {
            await updateSubscription(supabase, subs.user_id, {
              status: "past_due",
              metadata: {
                lastPaymentFailed: new Date().toISOString(),
                failedInvoiceId: invoice.id,
              },
            });
          }
        }

        console.log(`Stripe invoice payment failed: ${invoice.id}`);
        break;
      }

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

/**
 * GET endpoint for Stripe webhook verification (optional, for testing)
 */
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
