export interface PolarCheckoutSessionOptions {
  userId: string;
  userEmail: string;
  plan: string;
  billingCycle: "monthly" | "annual";
  successUrl: string;
  cancelUrl: string;
  idempotencyKey: string;
  customerId?: string;
}

export interface PolarProductPayload {
  id?: string;
  prices?: Array<{
    id?: string;
    recurring_interval?: string;
    recurring_interval_count?: number;
    type?: string;
  }>;
}

export function selectPriceIdFromProduct(
  product: PolarProductPayload | undefined,
  billingCycle: "monthly" | "annual",
): string | undefined {
  const prices = product?.prices ?? [];

  return prices.find((price) => {
    if (!price.id) {
      return false;
    }

    const isRecurring = price.type === "recurring" || Boolean(price.recurring_interval);
    if (!isRecurring) {
      return false;
    }

    const interval = price.recurring_interval?.toLowerCase();
    if (billingCycle === "annual") {
      return interval === "year" || interval === "yearly";
    }

    return interval === "month" || interval === "monthly";
  })?.id;
}

function getEnvPriceIdForPlan(plan: string, billingCycle: "monthly" | "annual"): string | undefined {
  const envKey =
    billingCycle === "annual"
      ? `POLAR_PRICE_${plan.toUpperCase()}_ANNUAL`
      : `POLAR_PRICE_${plan.toUpperCase()}_MONTHLY`;

  return process.env[envKey];
}

function getProductIdForPlan(plan: string): string | undefined {
  const specificEnvKey = `POLAR_PRODUCT_ID_${plan.toUpperCase()}`;
  return process.env[specificEnvKey] || process.env.POLAR_PRODUCT_ID;
}

function hasPolarPriceConfiguration(): boolean {
  const configured = [
    process.env.POLAR_PRODUCT_PRICE_ID,
    process.env.POLAR_CHECKOUT_URL,
    process.env.POLAR_PRODUCT_ID,
    process.env.POLAR_PRODUCT_ID_STARTER,
    process.env.POLAR_PRODUCT_ID_PRO,
    process.env.POLAR_PRODUCT_ID_ULTRA,
    process.env.POLAR_PRICE_STARTER_MONTHLY,
    process.env.POLAR_PRICE_STARTER_ANNUAL,
    process.env.POLAR_PRICE_PRO_MONTHLY,
    process.env.POLAR_PRICE_PRO_ANNUAL,
    process.env.POLAR_PRICE_ULTRA_MONTHLY,
    process.env.POLAR_PRICE_ULTRA_ANNUAL,
  ].filter((value): value is string => Boolean(value));

  return configured.length > 0;
}

export interface PolarCheckoutSessionResult {
  checkoutUrl: string;
  checkoutId: string;
  providerCustomerId?: string;
}

export class PolarClient {
  private readonly accessToken: string;
  private readonly baseUrl: string;
  private readonly productPriceId?: string;
  private readonly fallbackCheckoutUrl?: string;

  constructor(config: {
    accessToken: string;
    baseUrl: string;
    productPriceId?: string;
    fallbackCheckoutUrl?: string;
  }) {
    this.accessToken = config.accessToken;
    this.baseUrl = config.baseUrl;
    this.productPriceId = config.productPriceId;
    this.fallbackCheckoutUrl = config.fallbackCheckoutUrl;
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      let message = `Polar API request failed (${response.status}): ${errorText || response.statusText}`;

      try {
        const payload = JSON.parse(errorText) as {
          error?: string;
          detail?: Array<{ loc?: string[]; msg?: string; input?: unknown }>;
        };

        if (payload.detail?.length) {
          const detailMessage = payload.detail
            .map((item) => `${item.loc?.join(".") ?? "body"}: ${item.msg ?? "validation failed"}`)
            .join("; ");

          if (detailMessage) {
            message = `Polar API request failed (${response.status}): ${detailMessage}`;
          }
        }
      } catch {
        // Keep the original fallback message.
      }

      if (this.isInvalidPriceError(message)) {
        message += " Check the matching POLAR_PRICE_* env var for the selected plan and billing cycle in .env.local.";
      }

      throw new Error(message);
    }

    return (await response.json()) as T;
  }

  private isDuplicateCustomerError(message: string): boolean {
    const normalized = message.toLowerCase();
    return (
      normalized.includes("customer with this email address already exists") ||
      normalized.includes("customer with this external id already exists") ||
      normalized.includes("already exists") ||
      normalized.includes("duplicate")
    );
  }

  private isInvalidPriceError(message: string): boolean {
    const normalized = message.toLowerCase();
    return normalized.includes("price does not exist") || normalized.includes("product_price_id");
  }

  async getOrCreateCustomer(
    userEmail: string,
    metadata: { userId: string },
  ): Promise<string | undefined> {
    const payload = {
      email: userEmail,
      external_id: metadata.userId,
      metadata: {
        userId: metadata.userId,
      },
    };

    const data = await this.request<Record<string, unknown>>("/customers", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (typeof data.id === "string") {
      return data.id;
    }

    if (typeof data.external_id === "string") {
      return data.external_id;
    }

    return undefined;
  }

  async createCheckoutSession(
    options: PolarCheckoutSessionOptions,
  ): Promise<PolarCheckoutSessionResult> {
    let priceId = getEnvPriceIdForPlan(options.plan, options.billingCycle) || this.productPriceId;

    if (!priceId) {
      const productId = getProductIdForPlan(options.plan);

      if (productId) {
        try {
          const product = await this.request<PolarProductPayload>(`/products/${encodeURIComponent(productId)}`);
          priceId = selectPriceIdFromProduct(product, options.billingCycle);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          if (!this.isInvalidPriceError(message)) {
            throw error;
          }
        }
      }
    }

    if (!priceId && !this.fallbackCheckoutUrl) {
      const productUrl = `${this.baseUrl}/products?limit=100`;
      throw new Error(
        `Polar checkout is not configured. Set POLAR_PRICE_* variables for the selected plan or provide POLAR_PRODUCT_ID_STARTER/PRO/ULTRA and let the app resolve the recurring price from Polar. Product lookup endpoint: ${productUrl}`,
      );
    }

    if (!priceId && this.fallbackCheckoutUrl) {
      return {
        checkoutUrl: this.fallbackCheckoutUrl,
        checkoutId: "",
      };
    }

    let customerId = options.customerId;

    if (!customerId) {
      try {
        customerId = await this.getOrCreateCustomer(options.userEmail, {
          userId: options.userId,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (!this.isDuplicateCustomerError(message)) {
          throw error;
        }
      }
    }

    const payload = {
      product_price_id: priceId,
      ...(customerId ? { customer_id: customerId } : {}),
      customer_external_id: options.userId,
      customer_email: options.userEmail,
      success_url: options.successUrl,
      cancel_url: options.cancelUrl,
      metadata: {
        userId: options.userId,
        plan: options.plan,
        billingCycle: options.billingCycle,
        idempotencyKey: options.idempotencyKey,
      },
    };

    const data = await this.request<Record<string, unknown>>("/checkouts", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const checkoutUrl =
      (typeof data.url === "string" && data.url) ||
      (typeof data.checkout_url === "string" && data.checkout_url) ||
      (typeof data.hosted_page_url === "string" && data.hosted_page_url) ||
      "";

    if (!checkoutUrl) {
      throw new Error("Polar did not return a checkout URL.");
    }

    return {
      checkoutUrl,
      checkoutId: typeof data.id === "string" ? data.id : "",
      providerCustomerId: customerId,
    };
  }

  async cancelSubscription(_subscriptionId: string, immediate = false) {
    void immediate;
    return undefined;
  }
}

export function initPolarClient(): PolarClient {
  const accessToken = process.env.POLAR_ACCESS_TOKEN;
  const productPriceId = process.env.POLAR_PRODUCT_PRICE_ID;
  const fallbackCheckoutUrl = process.env.POLAR_CHECKOUT_URL;
  const environment = process.env.POLAR_ENVIRONMENT === "sandbox" ? "sandbox" : "production";

  if (!accessToken) {
    throw new Error(
      "POLAR_ACCESS_TOKEN is not configured. Add your Polar organization access token to .env.local.",
    );
  }

  if (!hasPolarPriceConfiguration()) {
    throw new Error(
      "Polar checkout is not configured. Set POLAR_PRODUCT_PRICE_ID, POLAR_PRODUCT_ID_STARTER/PRO/ULTRA, the per-plan POLAR_PRICE_* variables, or POLAR_CHECKOUT_URL.",
    );
  }

  return new PolarClient({
    accessToken,
    baseUrl:
      environment === "sandbox"
        ? "https://sandbox-api.polar.sh/v1"
        : "https://api.polar.sh/v1",
    productPriceId,
    fallbackCheckoutUrl,
  });
}
