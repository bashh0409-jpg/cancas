import type { SupabaseClient } from "@supabase/supabase-js";

export type SubscriptionPlan = "free" | "starter" | "pro" | "ultra";
export type SubscriptionProvider = "local" | "payfast" | "stripe" | "2checkout";
export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "canceled"
  | "past_due"
  | "unpaid"
  | "expired"
  | "paused";
export type BillingCycle = "monthly" | "annual" | "one_time" | "custom";

export interface UserSubscription {
  user_id: string;
  provider: SubscriptionProvider;
  provider_customer_id?: string;
  provider_subscription_id?: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  billing_cycle: BillingCycle;
  current_period_start?: string;
  current_period_end?: string;
  trial_end?: string;
  cancel_at_period_end: boolean;
  canceled_at?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CreateSubscriptionInput {
  user_id: string;
  provider: SubscriptionProvider;
  plan: SubscriptionPlan;
  billing_cycle?: BillingCycle;
  provider_customer_id?: string;
  provider_subscription_id?: string;
  current_period_start?: string;
  current_period_end?: string;
  trial_end?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateSubscriptionInput {
  status?: SubscriptionStatus;
  plan?: SubscriptionPlan;
  provider_subscription_id?: string;
  current_period_start?: string;
  current_period_end?: string;
  trial_end?: string;
  cancel_at_period_end?: boolean;
  canceled_at?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Get user's current subscription
 */
export async function getUserSubscription(
  supabase: SupabaseClient,
  userId: string,
): Promise<UserSubscription | null> {
  const { data, error } = await supabase
    .from("user_subscriptions")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null; // Row not found
    }
    throw error;
  }

  return data as UserSubscription;
}

/**
 * Create a new subscription (usually called during signup)
 */
export async function createSubscription(
  supabase: SupabaseClient,
  input: CreateSubscriptionInput,
): Promise<UserSubscription> {
  const { data, error } = await supabase
    .from("user_subscriptions")
    .insert([
      {
        user_id: input.user_id,
        provider: input.provider,
        plan: input.plan,
        billing_cycle: input.billing_cycle || "monthly",
        provider_customer_id: input.provider_customer_id,
        provider_subscription_id: input.provider_subscription_id,
        current_period_start: input.current_period_start,
        current_period_end: input.current_period_end,
        trial_end: input.trial_end,
        metadata: input.metadata,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data as UserSubscription;
}

/**
 * Update user's subscription
 */
export async function updateSubscription(
  supabase: SupabaseClient,
  userId: string,
  input: UpdateSubscriptionInput,
): Promise<UserSubscription> {
  const { data, error } = await supabase
    .from("user_subscriptions")
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw error;
  return data as UserSubscription;
}

/**
 * Upgrade or downgrade plan
 */
export async function updateSubscriptionPlan(
  supabase: SupabaseClient,
  userId: string,
  newPlan: SubscriptionPlan,
  metadata?: Record<string, unknown>,
): Promise<UserSubscription> {
  return updateSubscription(supabase, userId, {
    plan: newPlan,
    metadata: metadata || {},
  });
}

/**
 * Cancel subscription (set cancel_at_period_end to true for graceful cancellation)
 */
export async function cancelSubscription(
  supabase: SupabaseClient,
  userId: string,
  immediate = false,
): Promise<UserSubscription> {
  return updateSubscription(supabase, userId, {
    status: immediate ? "canceled" : "active",
    cancel_at_period_end: !immediate,
    canceled_at: immediate ? new Date().toISOString() : undefined,
  });
}

/**
 * Check if user has active subscription (not canceled/expired)
 */
export async function hasActiveSubscription(
  supabase: SupabaseClient,
  userId: string,
): Promise<boolean> {
  const subscription = await getUserSubscription(supabase, userId);
  if (!subscription) return false;

  const validStatuses: SubscriptionStatus[] = ["active", "trialing"];
  if (!validStatuses.includes(subscription.status)) return false;

  // Check if current period has ended
  if (subscription.current_period_end) {
    const periodEnd = new Date(subscription.current_period_end);
    if (periodEnd < new Date()) return false;
  }

  return true;
}

/**
 * Check if subscription is past due or unpaid
 */
export async function isSubscriptionInArrears(
  supabase: SupabaseClient,
  userId: string,
): Promise<boolean> {
  const subscription = await getUserSubscription(supabase, userId);
  if (!subscription) return false;

  return ["past_due", "unpaid"].includes(subscription.status);
}

/**
 * Get plan details (for UI display)
 */
export function getPlanDetails(plan: SubscriptionPlan): {
  name: string;
  monthlyCredits: number;
  displayName: string;
} {
  const plans = {
    free: { name: "Free", monthlyCredits: 100, displayName: "Free Plan" },
    starter: {
      name: "Starter",
      monthlyCredits: 1000,
      displayName: "Starter Plan",
    },
    pro: { name: "Pro", monthlyCredits: 5000, displayName: "Pro Plan" },
    ultra: { name: "Ultra", monthlyCredits: 20000, displayName: "Ultra Plan" },
  };

  return plans[plan];
}

/**
 * Get available plans for a given provider (for checkout)
 */
export function getAvailablePlans(
  provider: SubscriptionProvider,
): SubscriptionPlan[] {
  // All providers offer all plans
  return ["free", "starter", "pro", "ultra"];
}
