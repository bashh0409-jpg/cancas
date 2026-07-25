import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getPaymentProviderForCountry,
  getPricingForProvider,
  initializePaymentProvider,
} from "@/lib/billing/provider";
import { PolarClient } from "@/lib/billing/polar";
import {
  createSubscription,
  type SubscriptionPlan,
  type SubscriptionProvider,
} from "@/lib/subscriptions/repository";

export type CheckoutRequest = {
  userId: string;
  userEmail: string;
  firstName: string;
  lastName: string;
  plan: SubscriptionPlan;
  billingCycle: "monthly" | "annual";
  countryCode: string;
  returnUrl?: string;
  cancelUrl?: string;
  idempotencyKey: string;
};

export type CheckoutResult = {
  checkoutUrl: string;
  provider: SubscriptionProvider;
};

function isPaidPlan(plan: string): plan is Exclude<SubscriptionPlan, "free"> {
  return plan === "starter" || plan === "pro" || plan === "ultra";
}

export async function createBillingCheckout(
  supabase: SupabaseClient,
  request: CheckoutRequest,
): Promise<CheckoutResult> {
  const {
    userId,
    userEmail,
    firstName,
    lastName,
    plan,
    billingCycle,
    countryCode,
    returnUrl,
    cancelUrl,
    idempotencyKey,
  } = request;

  if (!isPaidPlan(plan)) {
    throw new Error("Invalid plan");
  }

  const provider = getPaymentProviderForCountry(countryCode);
  const pricing = getPricingForProvider(provider, plan, billingCycle);
  const paymentClient = initializePaymentProvider(provider);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  let checkoutUrl: string;
  let providerCustomerId: string | undefined;

  if (provider === "polar") {
    const polarClient = paymentClient as PolarClient;

    const result = await polarClient.createCheckoutSession({
      userId,
      userEmail,
      plan,
      billingCycle,
      successUrl: returnUrl ?? `${appUrl}/billing/success`,
      cancelUrl: cancelUrl ?? `${appUrl}/billing/cancel`,
      idempotencyKey,
    });

    checkoutUrl = result.checkoutUrl;
    providerCustomerId = result.providerCustomerId;
  } else {
    throw new Error(`Unsupported payment provider: ${provider}`);
  }

  await createSubscription(supabase, {
    user_id: userId,
    provider,
    plan,
    billing_cycle: billingCycle,
    status: "unpaid",
    provider_customer_id: providerCustomerId,
    metadata: {
      countryCode,
      idempotencyKey,
      initiatedAt: new Date().toISOString(),
    },
  });

  return { checkoutUrl, provider };
}
