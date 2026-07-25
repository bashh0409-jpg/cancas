import type { SupabaseClient } from "@supabase/supabase-js";
import { initializePaymentProvider } from "@/lib/billing/provider";
import { PolarClient } from "@/lib/billing/polar";
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
    subscription.provider === "polar" &&
    subscription.provider_subscription_id
  ) {
    const polarClient = initializePaymentProvider("polar") as PolarClient;
    await polarClient.cancelSubscription(
      subscription.provider_subscription_id,
      immediate,
    );
  }

  // Polar handles cancellations through its customer portal and webhooks.
  // We still mark the local subscription as canceled so the app reflects intent.

  return cancelSubscription(supabase, userId, immediate);
}
