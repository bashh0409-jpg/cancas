import type { SupabaseClient } from "@supabase/supabase-js";
import { initializePaymentProvider } from "@/lib/billing/provider";
import { StripeClient } from "@/lib/billing/stripe";
import {
  cancelSubscription,
  getUserSubscription,
} from "@/lib/subscriptions/repository";

export async function cancelBillingSubscription(
  supabase: SupabaseClient,
  userId: string,
  immediate = false,
) {
  const subscription = await getUserSubscription(supabase, userId);

  if (!subscription) {
    throw new Error("Subscription not found");
  }

  if (
    subscription.provider === "stripe" &&
    subscription.provider_subscription_id
  ) {
    const stripeClient = initializePaymentProvider("stripe") as StripeClient;
    await stripeClient.cancelSubscription(
      subscription.provider_subscription_id,
      immediate,
    );
  }

  // PayFast cancellations are managed through the PayFast merchant dashboard.
  // We still mark the local subscription as canceled so the app reflects intent.

  return cancelSubscription(supabase, userId, immediate);
}
