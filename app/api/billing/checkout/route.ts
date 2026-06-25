import { createClient } from "@/lib/supabase/server";
import {
  getPaymentProviderForCountry,
  initializePaymentProvider,
  getPricingForProvider,
} from "@/lib/billing/provider";
import {
  createSubscription,
  type SubscriptionProvider,
} from "@/lib/subscriptions/repository";
import { PayFastClient } from "@/lib/billing/payfast";
import { StripeClient } from "@/lib/billing/stripe";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      plan,
      billingCycle = "monthly",
      countryCode,
      returnUrl,
      cancelUrl,
      idempotencyKey,
    } = body;
    const normalizedIdempotencyKey =
      typeof idempotencyKey === "string" && idempotencyKey.trim().length > 0
        ? idempotencyKey.trim()
        : crypto.randomUUID();

    const normalizedBillingCycle =
      billingCycle === "annually" ? "annual" : billingCycle;

    if (!plan || !countryCode) {
      return NextResponse.json(
        { error: "Missing required fields: plan, countryCode" },
        { status: 400 },
      );
    }

    if (!["starter", "pro", "ultra"].includes(plan)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    if (!["monthly", "annual"].includes(normalizedBillingCycle)) {
      return NextResponse.json(
        { error: "Invalid billing cycle" },
        { status: 400 },
      );
    }

    // Get payment provider for user's country
    const provider = getPaymentProviderForCountry(countryCode);
    const pricing = getPricingForProvider(provider, plan, normalizedBillingCycle);

    // Initialize appropriate payment provider
    const paymentClient = initializePaymentProvider(provider);

    let checkoutUrl: string;
    let providerCustomerId: string | undefined;

    if (provider === "payfast") {
      const payfastClient = paymentClient as PayFastClient;

      const firstName = user.user_metadata?.full_name?.split(" ")[0] || "User";
      const lastName = user.user_metadata?.full_name?.split(" ")[1] || "";

      const checkoutData = payfastClient.generateRecurringSubscriptionRequest({
        userId: user.id,
        firstName,
        lastName,
        email: user.email || "",
        plan,
        amount: pricing.amount.toString(),
        description: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan - ${billingCycle}`,
        frequency:
          normalizedBillingCycle === "annual" ? "annual" : "monthly",
        idempotencyKey: normalizedIdempotencyKey,
      });

      checkoutUrl = payfastClient.createCheckoutUrl({
        ...checkoutData,
        return_url:
          returnUrl || `${process.env.NEXT_PUBLIC_APP_URL}/billing/success`,
        cancel_url:
          cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/billing/cancel`,
        notify_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/billing/webhooks/payfast`,
      });
    } else if (provider === "stripe") {
      const stripeClient = paymentClient as StripeClient;

      // Get or create Stripe customer
      providerCustomerId = await stripeClient.getOrCreateCustomer(
        user.email || "",
        { userId: user.id },
      );

      checkoutUrl = await stripeClient.createCheckoutSession({
        userId: user.id,
        userEmail: user.email || "",
        plan: plan as "starter" | "pro" | "ultra",
        billingCycle: normalizedBillingCycle as "monthly" | "annual",
        successUrl:
          returnUrl || `${process.env.NEXT_PUBLIC_APP_URL}/billing/success`,
        cancelUrl:
          cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/billing/cancel`,
        idempotencyKey: normalizedIdempotencyKey,
      });
    } else {
      return NextResponse.json(
        { error: "Unsupported payment provider" },
        { status: 400 },
      );
    }

    // Create subscription record in database (status will be 'trialing' or 'unpaid' until webhook confirms)
    const subscription = await createSubscription(supabase, {
      user_id: user.id,
      provider: provider as SubscriptionProvider,
      plan: plan as "starter" | "pro" | "ultra",
      billing_cycle: normalizedBillingCycle as "monthly" | "annual",
      provider_customer_id: providerCustomerId,
      metadata: {
        countryCode,
        checkoutUrl,
        idempotencyKey: normalizedIdempotencyKey,
        initiatedAt: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      checkoutUrl,
      provider,
      subscriptionId: subscription.user_id,
    });
  } catch (error) {
    console.error("Checkout error:", error);

    let message = "Failed to initialize checkout";

    if (error instanceof Error) {
      message = error.message;
    } else if (
      error &&
      typeof error === "object" &&
      "message" in error
    ) {
      const maybeMessage = (error as Record<string, unknown>).message;
      if (typeof maybeMessage === "string") {
        message = maybeMessage;
      }
    } else if (typeof error === "string") {
      message = error;
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
