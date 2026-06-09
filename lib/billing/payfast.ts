import crypto from "crypto";

/**
 * PayFast Payment Gateway Integration
 * Supports subscriptions in South Africa using PayFast
 */

export interface PayFastConfig {
  merchantId: string;
  merchantKey: string;
  returnUrl: string;
  cancelUrl: string;
  notifyUrl: string;
  sandbox?: boolean;
}

export interface PayFastCheckoutData {
  merchant_id: string;
  merchant_key: string;
  return_url: string;
  cancel_url: string;
  notify_url: string;
  name_first: string;
  name_last: string;
  email_address: string;
  item_name: string;
  item_description: string;
  amount: string;
  item_id: string;
  custom_int1?: string; // user_id or subscription_id
  custom_str1?: string; // plan name
  subscription_type: "1" | "2" | "3"; // Recurring
  billing_frequency?: string;
  recurring?: "1";
  cycles?: string;
  signature: string;
}

export interface PayFastWebhookData {
  m_payment_id: string;
  pf_payment_id: string;
  payment_status: "COMPLETE" | "FAILED" | "PENDING" | "CANCELLED";
  item_name: string;
  item_description: string;
  amount_gross: string;
  amount_fee: string;
  amount_net: string;
  custom_int1?: string;
  custom_str1?: string;
  status: string;
  signature: string;
  [key: string]: unknown;
}

export class PayFastClient {
  private config: PayFastConfig;
  private baseUrl: string;

  constructor(config: PayFastConfig) {
    this.config = config;
    this.baseUrl = config.sandbox
      ? "https://sandbox.payfast.co.za"
      : "https://api.payfast.co.za";
  }

  /**
   * Generate signature for PayFast request
   */
  generateSignature(data: Record<string, string>): string {
    const sortedData = Object.keys(data)
      .sort()
      .reduce(
        (acc, key) => {
          acc[key] = data[key];
          return acc;
        },
        {} as Record<string, string>,
      );

    const dataString = Object.entries(sortedData)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join("&");

    const signatureString = `${dataString}&passphrase=${encodeURIComponent(
      this.config.merchantKey,
    )}`;

    return crypto.createHash("md5").update(signatureString).digest("hex");
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(data: PayFastWebhookData): boolean {
    const signature = data.signature;
    const dataWithoutSignature = { ...data };
    delete dataWithoutSignature.signature;

    const computedSignature = this.generateSignature(
      dataWithoutSignature as Record<string, string>,
    );
    return computedSignature === signature;
  }

  /**
   * Create checkout URL for subscription
   */
  createCheckoutUrl(data: Omit<PayFastCheckoutData, "signature">): string {
    const checkoutData = {
      ...data,
      merchant_id: this.config.merchantId,
      merchant_key: this.config.merchantKey,
      return_url: this.config.returnUrl,
      cancel_url: this.config.cancelUrl,
      notify_url: this.config.notifyUrl,
    };

    const signature = this.generateSignature(
      checkoutData as Record<string, string>,
    );

    const params = new URLSearchParams({
      ...checkoutData,
      signature,
    });

    return `${this.baseUrl}/eng/process?${params.toString()}`;
  }

  /**
   * Generate recurring subscription payment request
   */
  generateRecurringSubscriptionRequest(options: {
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    plan: string;
    amount: string; // ZAR amount
    description: string;
    frequency:
      | "daily"
      | "weekly"
      | "monthly"
      | "quarterly"
      | "semi-annual"
      | "annual";
    cycles?: number;
  }): Omit<PayFastCheckoutData, "signature"> {
    const frequencyMap = {
      daily: "1",
      weekly: "2",
      monthly: "3",
      quarterly: "4",
      "semi-annual": "5",
      annual: "6",
    };

    return {
      merchant_id: this.config.merchantId,
      merchant_key: this.config.merchantKey,
      return_url: this.config.returnUrl,
      cancel_url: this.config.cancelUrl,
      notify_url: this.config.notifyUrl,
      name_first: options.firstName,
      name_last: options.lastName,
      email_address: options.email,
      item_name: options.plan,
      item_description: options.description,
      amount: options.amount,
      item_id: options.userId,
      custom_int1: options.userId,
      custom_str1: options.plan,
      subscription_type: "2", // Recurring
      billing_frequency: frequencyMap[options.frequency],
      recurring: "1",
      cycles: options.cycles?.toString() || "0", // 0 = until canceled
    };
  }

  /**
   * Get Merchant ID from config (for requests)
   */
  getMerchantId(): string {
    return this.config.merchantId;
  }
}

/**
 * Initialize PayFast client from environment variables
 */
export function initPayFastClient(sandbox = false): PayFastClient {
  const merchantId = process.env.PAYFAST_MERCHANT_ID;
  const merchantKey = process.env.PAYFAST_MERCHANT_KEY;
  const returnUrl = process.env.PAYFAST_RETURN_URL;
  const cancelUrl = process.env.PAYFAST_CANCEL_URL;
  const notifyUrl = process.env.PAYFAST_NOTIFY_URL;

  if (!merchantId || !merchantKey || !returnUrl || !cancelUrl || !notifyUrl) {
    throw new Error("Missing PayFast environment variables");
  }

  return new PayFastClient({
    merchantId,
    merchantKey,
    returnUrl,
    cancelUrl,
    notifyUrl,
    sandbox,
  });
}
