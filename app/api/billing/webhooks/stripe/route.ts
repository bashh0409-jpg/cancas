import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { initStripeClient } from "@/lib/billing/stripe";
import { addUserCredits } from "@/lib/credits/repository";
import {
  updateSubscription,
  getPlanDetails,
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
    let event;
    try {
      event = stripeClient
        .getStripeInstance()
        .webhooks.constructEvent(body, signature, webhookSecret);
    } catch (error) {
      console.error("Stripe webhook signature verification failed:", error);
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 401 },
      );
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.error("NEXT_PUBLIC_SUPABASE_URL is not configured");
      return NextResponse.json(
        { error: "Supabase URL not configured" },
        { status: 500 },
      );
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("SUPABASE_SERVICE_ROLE_KEY is not configured");
      return NextResponse.json(
        { error: "Supabase service role key not configured" },
        { status: 500 },
      );
    }

    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    );

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
        const subscriptionId =
          typeof (invoice as any).subscription === "string"
            ? (invoice as any).subscription
            : ((invoice as any).parent?.subscription_details?.subscription as
                | string
                | null);

        if (subscriptionId) {
          const { data: subs, error: subsError } = await supabase
            .from("user_subscriptions")
            .select("user_id, plan, billing_cycle")
            .eq("provider_subscription_id", subscriptionId)
            .single();

          if (subsError) {
            console.error(
              "Failed to lookup subscription for Stripe invoice:",
              subsError,
            );
            break;
          }

          if (subs) {
            await updateSubscription(supabase, subs.user_id, {
              status: "active",
              metadata: {
                lastPaymentSucceeded: new Date().toISOString(),
              },
            });

            try {
              const cycleMultiplier =
                subs.billing_cycle === "annual" ? 12 : 1;
              const creditsToGrant =
                getPlanDetails(subs.plan).monthlyCredits * cycleMultiplier;

              if (creditsToGrant > 0) {
                await addUserCredits(supabase, subs.user_id, creditsToGrant);
                console.log(
                  `Granted ${creditsToGrant} credits to user ${subs.user_id}`,
                );
              }
            } catch (err) {
              console.error(
                "Failed to grant credits for Stripe invoice payment:",
                err,
              );
            }
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
