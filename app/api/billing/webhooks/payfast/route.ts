import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { initPayFastClient } from "@/lib/billing/payfast";
import {
  updateSubscription,
  getPlanDetails,
} from "@/lib/subscriptions/repository";
import { setUserCredits } from "@/lib/credits/repository";
import { NextResponse } from "next/server";

/**
 * PayFast Webhook Handler
 * Processes payment confirmations from PayFast
 * POST /api/billing/webhooks/payfast
 */
export async function POST(req: Request) {
  try {
    // Parse form data (PayFast sends data as form-encoded)
    const formData = await req.formData();
    const webhookData: Record<string, string> = {};

    formData.forEach((value, key) => {
      webhookData[key] = value.toString();
    });

    // Initialize PayFast client for verification
    const payfast = initPayFastClient(process.env.NODE_ENV === "development");

    // Verify webhook signature
    if (!payfast.verifyWebhookSignature(webhookData as any)) {
      console.error("Invalid PayFast webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const {
      m_payment_id,
      pf_payment_id,
      payment_status,
      custom_int1: userIdStr,
      custom_str1: plan,
    } = webhookData;

    if (!userIdStr || !plan) {
      console.error("Missing custom fields in PayFast webhook");
      return NextResponse.json(
        { error: "Missing custom fields" },
        { status: 400 },
      );
    }

    const userId = userIdStr;
    // Use service role key for webhook updates to bypass RLS
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // Map PayFast payment status to subscription status
    let subscriptionStatus: "active" | "pending" | "canceled" | "past_due";

    switch (payment_status) {
      case "COMPLETE":
        subscriptionStatus = "active";
        break;
      case "PENDING":
        subscriptionStatus = "pending";
        break;
      case "FAILED":
      case "CANCELLED":
        subscriptionStatus = "canceled";
        break;
      default:
        subscriptionStatus = "pending";
    }

    // Update subscription in database
    const updated = await updateSubscription(supabase, userId, {
      status: subscriptionStatus as any,
      provider_subscription_id: pf_payment_id,
      metadata: {
        paymentId: m_payment_id,
        lastWebhookAt: new Date().toISOString(),
      },
    });

    // If subscription is now active, grant monthly credits based on plan
    if (subscriptionStatus === "active") {
      try {
        const planKey = (plan as string).toLowerCase() as any;
        const details = getPlanDetails(planKey);
        const creditsToGrant = details.monthlyCredits || 0;

        if (creditsToGrant > 0) {
          await setUserCredits(supabase, userId, creditsToGrant);
          console.log(`Granted ${creditsToGrant} credits to user ${userId}`);
        }
      } catch (err) {
        console.error(
          "Failed to grant credits after subscription activation:",
          err,
        );
      }
    }

    // Log webhook for debugging
    console.log(
      `PayFast webhook processed: Payment ${pf_payment_id} - ${payment_status}`,
    );

    // PayFast requires a 200 response to acknowledge receipt
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("PayFast webhook error:", error);
    // Still return 200 to PayFast to prevent retries for server errors
    // Log the error for investigation
    return NextResponse.json(
      { error: "Webhook processing error" },
      { status: 200 },
    );
  }
}

/**
 * GET endpoint for PayFast webhook verification (optional, for testing)
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const testMode = url.searchParams.get("test");

  if (testMode !== "true") {
    return NextResponse.json({ error: "Test mode disabled" }, { status: 403 });
  }

  return NextResponse.json({
    message: "PayFast webhook endpoint is ready",
    environment: process.env.NODE_ENV,
  });
}
