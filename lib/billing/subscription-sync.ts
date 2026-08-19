import type { SupabaseClient } from "@supabase/supabase-js";
import { addUserCredits } from "@/lib/credits/repository";
import {
  getPlanDetails,
  getSubscriptionByProviderSubscriptionId,
  getUserSubscription,
  updateSubscription,
  type BillingCycle,
  type SubscriptionPlan,
  type SubscriptionStatus,
  type UserSubscription,
} from "@/lib/subscriptions/repository";

export type SubscriptionLookup = {
  user_id: string;
  plan: SubscriptionPlan;
  billing_cycle: BillingCycle;
};

export async function grantPlanCredits(
  supabase: SupabaseClient,
  userId: string,
  plan: SubscriptionPlan,
  billingCycle: BillingCycle,
  idempotencyKey: string,
  scope: string,
): Promise<void> {
  void billingCycle;
  const creditsToGrant = getPlanDetails(plan).monthlyCredits;

  if (creditsToGrant <= 0) {
    return;
  }

  await addUserCredits(supabase, userId, creditsToGrant, idempotencyKey, scope);
}

export async function resolveSubscriptionForStripeInvoice(
  supabase: SupabaseClient,
  subscriptionId: string,
  fallbackUserId?: string | null,
): Promise<SubscriptionLookup | null> {
  const byProviderId = await getSubscriptionByProviderSubscriptionId(
    supabase,
    subscriptionId,
  );

  if (byProviderId) {
    return {
      user_id: byProviderId.user_id,
      plan: byProviderId.plan,
      billing_cycle: byProviderId.billing_cycle,
    };
  }

  if (fallbackUserId) {
    const subscription = await getUserSubscription(supabase, fallbackUserId);

    if (subscription) {
      return {
        user_id: subscription.user_id,
        plan: subscription.plan,
        billing_cycle: subscription.billing_cycle,
      };
    }
  }

  return null;
}

export async function activatePaidSubscription(
  supabase: SupabaseClient,
  userId: string,
  input: {
    plan?: SubscriptionPlan;
    billingCycle?: BillingCycle;
    status?: SubscriptionStatus;
    providerSubscriptionId?: string;
    providerCustomerId?: string;
    currentPeriodStart?: string;
    currentPeriodEnd?: string;
    metadata?: Record<string, unknown>;
  },
): Promise<UserSubscription> {
  return updateSubscription(supabase, userId, {
    ...(input.plan ? { plan: input.plan } : {}),
    ...(input.billingCycle ? { billing_cycle: input.billingCycle } : {}),
    status: input.status ?? "active",
    ...(input.providerSubscriptionId
      ? { provider_subscription_id: input.providerSubscriptionId }
      : {}),
    ...(input.providerCustomerId
      ? { provider_customer_id: input.providerCustomerId }
      : {}),
    ...(input.currentPeriodStart
      ? { current_period_start: input.currentPeriodStart }
      : {}),
    ...(input.currentPeriodEnd
      ? { current_period_end: input.currentPeriodEnd }
      : {}),
    metadata: {
      activatedAt: new Date().toISOString(),
      ...input.metadata,
    },
  });
}

export async function markSubscriptionPastDue(
  supabase: SupabaseClient,
  userId: string,
  metadata: Record<string, unknown>,
): Promise<void> {
  await updateSubscription(supabase, userId, {
    status: "past_due",
    metadata,
  });
}

export async function markSubscriptionCanceled(
  supabase: SupabaseClient,
  userId: string,
  metadata: Record<string, unknown>,
): Promise<void> {
  await updateSubscription(supabase, userId, {
    status: "canceled",
    canceled_at: new Date().toISOString(),
    metadata,
  });
}
