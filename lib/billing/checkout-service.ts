import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getPaymentProviderForCountry,
  getPricingForProvider,
  initializePaymentProvider,
} from "@/lib/billing/provider";
import { PayFastClient } from "@/lib/billing/payfast";
import { StripeClient } from "@/lib/billing/stripe";
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

  if (provider === "payfast") {
    const payfastClient = paymentClient as PayFastClient;
    const checkoutData = payfastClient.generateRecurringSubscriptionRequest({
      userId,
      firstName,
      lastName,
      email: userEmail,
      plan,
      amount: pricing.amount.toString(),
      description: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan - ${billingCycle}`,
      frequency: billingCycle === "annual" ? "annual" : "monthly",
      idempotencyKey,
    });

    checkoutUrl = payfastClient.createCheckoutUrl({
      ...checkoutData,
      return_url: returnUrl ?? `${appUrl}/billing/success`,
      cancel_url: cancelUrl ?? `${appUrl}/billing/cancel`,
      notify_url: `${appUrl}/api/billing/webhooks/payfast`,
    });
  } else if (provider === "stripe") {
    const stripeClient = paymentClient as StripeClient;

    providerCustomerId = await stripeClient.getOrCreateCustomer(userEmail, {
      userId,
    });

    checkoutUrl = await stripeClient.createCheckoutSession({
      userId,
      userEmail,
      customerId: providerCustomerId,
      plan,
      billingCycle,
      successUrl: returnUrl ?? `${appUrl}/billing/success`,
      cancelUrl: cancelUrl ?? `${appUrl}/billing/cancel`,
      idempotencyKey,
    });
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
