/**
 * Payment provider routing based on user location
 */

import type { SubscriptionProvider } from "@/lib/subscriptions/repository";
import { PayFastClient, initPayFastClient } from "./payfast";
import { StripeClient, initStripeClient } from "./stripe";

export interface ProviderConfig {
  provider: SubscriptionProvider;
  client: PayFastClient | StripeClient;
}

/**
 * Determine payment provider based on country code
 */
export function getPaymentProviderForCountry(
  countryCode: string,
): SubscriptionProvider {
  // Map countries to providers
  const providerMap: Record<string, SubscriptionProvider> = {
    // South Africa - PayFast
    ZA: "payfast",
    // USA, UK, Canada, Australia - Stripe
    US: "stripe",
    GB: "stripe",
    CA: "stripe",
    AU: "stripe",
    // EU countries - Stripe
    DE: "stripe",
    FR: "stripe",
    IT: "stripe",
    ES: "stripe",
    NL: "stripe",
    BE: "stripe",
    AT: "stripe",
    SE: "stripe",
    NO: "stripe",
    DK: "stripe",
    FI: "stripe",
    PL: "stripe",
    // Asia-Pacific - Stripe
    SG: "stripe",
    JP: "stripe",
    IN: "stripe",
    // Others - fallback to 2checkout (not implemented yet)
  };

  return providerMap[countryCode] || "stripe"; // Default to Stripe as global fallback
}

/**
 * Initialize payment provider client
 */
export function initializePaymentProvider(
  provider: SubscriptionProvider,
): PayFastClient | StripeClient {
  switch (provider) {
    case "payfast":
      return initPayFastClient(process.env.PAYFAST_SANDBOX === "true");
    case "stripe":
      return initStripeClient();
    default:
      throw new Error(`Unsupported payment provider: ${provider}`);
  }
}

/**
 * Get payment provider for user based on their country
 */
export function getProviderForUser(countryCode: string): ProviderConfig {
  const provider = getPaymentProviderForCountry(countryCode);
  const client = initializePaymentProvider(provider);

  return {
    provider,
    client,
  };
}

/**
 * Get available plans for a payment provider
 */
export function getAvailablePlansForProvider(
  provider: SubscriptionProvider,
): string[] {
  // All providers support these plans
  return ["starter", "pro", "ultra"];
}

/**
 * Get pricing for a plan in a specific provider's currency
 */
export function getPricingForProvider(
  provider: SubscriptionProvider,
  plan: string,
  billingCycle: "monthly" | "annual",
): {
  amount: number;
  currency: string;
  displayPrice: string;
} {
  const pricing: Record<string, Record<string, Record<string, any>>> = {
    payfast: {
      // ZAR pricing
      starter: {
        monthly: { amount: 199, currency: "ZAR", displayPrice: "R199/month" },
        annual: { amount: 1990, currency: "ZAR", displayPrice: "R1,990/year" },
      },
      pro: {
        monthly: { amount: 499, currency: "ZAR", displayPrice: "R499/month" },
        annual: { amount: 4990, currency: "ZAR", displayPrice: "R4,990/year" },
      },
      ultra: {
        monthly: { amount: 999, currency: "ZAR", displayPrice: "R999/month" },
        annual: { amount: 9990, currency: "ZAR", displayPrice: "R9,990/year" },
      },
    },
    stripe: {
      // USD pricing
      starter: {
        monthly: { amount: 9.99, currency: "USD", displayPrice: "$9.99/month" },
        annual: {
          amount: 99.99,
          currency: "USD",
          displayPrice: "$99.99/year",
        },
      },
      pro: {
        monthly: {
          amount: 24.99,
          currency: "USD",
          displayPrice: "$24.99/month",
        },
        annual: {
          amount: 249.99,
          currency: "USD",
          displayPrice: "$249.99/year",
        },
      },
      ultra: {
        monthly: {
          amount: 49.99,
          currency: "USD",
          displayPrice: "$49.99/month",
        },
        annual: {
          amount: 499.99,
          currency: "USD",
          displayPrice: "$499.99/year",
        },
      },
    },
  };

  return (
    pricing[provider]?.[plan]?.[billingCycle] || {
      amount: 0,
      currency: "USD",
      displayPrice: "Contact sales",
    }
  );
}
