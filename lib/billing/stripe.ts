/**
 * Stripe Payment Gateway Integration
 * Supports subscriptions in USA, UK, EU, and other Stripe-supported regions
 */

import Stripe from "stripe";

export type StripeProductId = "starter" | "pro" | "ultra";

export interface StripePlanConfig {
  productId: string;
  monthlyPriceId: string;
  annualPriceId: string;
}

export interface StripeCheckoutSessionOptions {
  userId: string;
  userEmail: string;
  plan: StripeProductId;
  billingCycle: "monthly" | "annual";
  successUrl: string;
  cancelUrl: string;
}

export interface StripeSubscriptionDetails {
  customerId: string;
  subscriptionId: string;
  productId: string;
  priceId: string;
  status: Stripe.Subscription.Status;
  currentPeriodStart: number;
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
}

export class StripeClient {
  private stripe: Stripe;
  private planConfig: Record<StripeProductId, StripePlanConfig>;

  constructor(apiKey: string) {
    this.stripe = new Stripe(apiKey, { apiVersion: "2024-11-20" });
    this.planConfig = {
      starter: {
        productId: process.env.STRIPE_PRODUCT_STARTER_ID || "prod_starter",
        monthlyPriceId:
          process.env.STRIPE_PRICE_STARTER_MONTHLY || "price_starter_monthly",
        annualPriceId:
          process.env.STRIPE_PRICE_STARTER_ANNUAL || "price_starter_annual",
      },
      pro: {
        productId: process.env.STRIPE_PRODUCT_PRO_ID || "prod_pro",
        monthlyPriceId:
          process.env.STRIPE_PRICE_PRO_MONTHLY || "price_pro_monthly",
        annualPriceId:
          process.env.STRIPE_PRICE_PRO_ANNUAL || "price_pro_annual",
      },
      ultra: {
        productId: process.env.STRIPE_PRODUCT_ULTRA_ID || "prod_ultra",
        monthlyPriceId:
          process.env.STRIPE_PRICE_ULTRA_MONTHLY || "price_ultra_monthly",
        annualPriceId:
          process.env.STRIPE_PRICE_ULTRA_ANNUAL || "price_ultra_annual",
      },
    };
  }

  /**
   * Create checkout session for subscription
   */
  async createCheckoutSession(
    options: StripeCheckoutSessionOptions,
  ): Promise<string> {
    const planConfig = this.planConfig[options.plan];
    const priceId =
      options.billingCycle === "annual"
        ? planConfig.annualPriceId
        : planConfig.monthlyPriceId;

    const session = await this.stripe.checkout.sessions.create({
      customer_email: options.userEmail,
      client_reference_id: options.userId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: options.successUrl,
      cancel_url: options.cancelUrl,
      metadata: {
        userId: options.userId,
        plan: options.plan,
      },
    });

    if (!session.url) {
      throw new Error("Failed to create Stripe checkout session");
    }

    return session.url;
  }

  /**
   * Get or create customer
   */
  async getOrCreateCustomer(
    email: string,
    metadata?: Record<string, string>,
  ): Promise<string> {
    const customers = await this.stripe.customers.list({
      email: email,
      limit: 1,
    });

    if (customers.data.length > 0) {
      return customers.data[0].id;
    }

    const newCustomer = await this.stripe.customers.create({
      email,
      metadata,
    });

    return newCustomer.id;
  }

  /**
   * Get subscription details
   */
  async getSubscription(
    subscriptionId: string,
  ): Promise<StripeSubscriptionDetails | null> {
    const subscription =
      await this.stripe.subscriptions.retrieve(subscriptionId);

    if (!subscription) return null;

    const priceId =
      subscription.items.data[0]?.price.id ||
      subscription.items.data[0]?.price.id;

    return {
      customerId: subscription.customer as string,
      subscriptionId: subscription.id,
      productId: subscription.items.data[0]?.price.product as string,
      priceId: priceId || "",
      status: subscription.status,
      currentPeriodStart: subscription.current_period_start,
      currentPeriodEnd: subscription.current_period_end,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    };
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(
    subscriptionId: string,
    immediate = false,
  ): Promise<void> {
    if (immediate) {
      await this.stripe.subscriptions.cancel(subscriptionId);
    } else {
      await this.stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(
    body: string,
    signature: string,
    webhookSecret: string,
  ): Stripe.Event | null {
    try {
      return this.stripe.webhooks.constructEvent(
        body,
        signature,
        webhookSecret,
      );
    } catch {
      return null;
    }
  }

  /**
   * Get Stripe instance for advanced operations
   */
  getStripeInstance(): Stripe {
    return this.stripe;
  }
}

/**
 * Initialize Stripe client from environment variables
 */
export function initStripeClient(): StripeClient {
  const apiKey = process.env.STRIPE_SECRET_KEY;

  if (!apiKey) {
    throw new Error(
      "STRIPE_SECRET_KEY is not configured. " +
        "For US users, get a test key from https://dashboard.stripe.com/test/apikeys and add it to .env.local",
    );
  }

  return new StripeClient(apiKey);
}
