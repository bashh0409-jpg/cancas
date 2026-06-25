import type { SupabaseClient } from "@supabase/supabase-js";
import type { PayFastWebhookData } from "@/lib/billing/payfast";
import { grantPlanCredits } from "@/lib/billing/subscription-sync";
import {
  updateSubscription,
  type SubscriptionPlan,
  type SubscriptionStatus,
} from "@/lib/subscriptions/repository";

const BILLING_PLANS = new Set<SubscriptionPlan>([
  "free",
  "starter",
  "pro",
  "ultra",
]);

function mapPayFastStatus(
  paymentStatus: PayFastWebhookData["payment_status"],
): SubscriptionStatus {
  switch (paymentStatus) {
    case "COMPLETE":
      return "active";
    case "PENDING":
      return "unpaid";
    case "FAILED":
    case "CANCELLED":
      return "canceled";
    default:
      return "unpaid";
  }
}

export async function handlePayFastWebhook(
  supabase: SupabaseClient,
  webhookData: PayFastWebhookData,
) {
  const {
    m_payment_id,
    pf_payment_id,
    payment_status,
    custom_int1: userId,
    custom_str1: plan,
    billing_frequency,
  } = webhookData;

  if (!userId || !plan) {
    throw new Error("Missing PayFast custom fields");
  }

  const subscriptionStatus = mapPayFastStatus(payment_status);

  await updateSubscription(supabase, userId, {
    status: subscriptionStatus,
    provider_subscription_id: pf_payment_id,
    metadata: {
      paymentId: m_payment_id,
      lastWebhookAt: new Date().toISOString(),
    },
  });

  if (subscriptionStatus !== "active") {
    return;
  }

  const planKey = plan.toLowerCase() as SubscriptionPlan;

  if (!BILLING_PLANS.has(planKey) || planKey === "free") {
    throw new Error(`Unsupported PayFast plan: ${plan}`);
  }

  const isAnnual = billing_frequency === "6" || billing_frequency === "annual";
  const billingCycle = isAnnual ? "annual" : "monthly";

  await grantPlanCredits(
    supabase,
    userId,
    planKey,
    billingCycle,
    pf_payment_id || m_payment_id,
    "payfast.payment.credit",
  );
}
