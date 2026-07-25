/**
 * Payment provider routing based on user location
 */

import type { SubscriptionProvider } from "@/lib/subscriptions/repository";
import { PolarClient, initPolarClient } from "./polar";

export interface ProviderConfig {
  provider: SubscriptionProvider;
  client: PolarClient;
}

/**
 * Determine payment provider based on country code
 */
export function getPaymentProviderForCountry(
  countryCode: string,
): SubscriptionProvider {
  const providerMap: Record<string, SubscriptionProvider> = {
    ZA: "polar",
    US: "polar",
    GB: "polar",
    CA: "polar",
    AU: "polar",
    DE: "polar",
    FR: "polar",
    IT: "polar",
    ES: "polar",
    NL: "polar",
    BE: "polar",
    AT: "polar",
    SE: "polar",
    NO: "polar",
    DK: "polar",
    FI: "polar",
    PL: "polar",
    SG: "polar",
    JP: "polar",
    IN: "polar",
  };

  return providerMap[countryCode] || "polar";
}

/**
 * Initialize payment provider client
 */
export function initializePaymentProvider(
  provider: SubscriptionProvider,
): PolarClient {
  switch (provider) {
    case "polar":
      return initPolarClient();
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
    polar: {
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
