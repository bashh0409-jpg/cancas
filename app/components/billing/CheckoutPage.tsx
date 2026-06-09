"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

export type BillingCycle = "monthly" | "annual";

interface PlanOption {
  id: "starter" | "pro" | "ultra";
  name: string;
  credits: number;
  monthlyPrice: string;
  annualPrice: string;
  features: string[];
}

const PLANS: PlanOption[] = [
  {
    id: "starter",
    name: "Starter",
    credits: 1000,
    monthlyPrice: "R199 / $9.99",
    annualPrice: "R1,990 / $99.99",
    features: [
      "1,000 monthly credits",
      "Basic AI features",
      "Email support",
      "5 active canvases",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    credits: 5000,
    monthlyPrice: "R499 / $24.99",
    annualPrice: "R4,990 / $249.99",
    features: [
      "5,000 monthly credits",
      "Advanced AI tools",
      "Priority support",
      "Unlimited canvases",
      "Custom templates",
    ],
  },
  {
    id: "ultra",
    name: "Ultra",
    credits: 20000,
    monthlyPrice: "R999 / $49.99",
    annualPrice: "R9,990 / $499.99",
    features: [
      "20,000 monthly credits",
      "Premium AI models",
      "24/7 dedicated support",
      "Unlimited everything",
      "API access",
      "White-label options",
    ],
  },
];

interface CheckoutPageProps {
  userCountry: string;
  userEmail: string;
}

export function CheckoutPage({ userCountry, userEmail }: CheckoutPageProps) {
  const [selectedPlan, setSelectedPlan] = useState<"starter" | "pro" | "ultra">(
    "pro",
  );
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: selectedPlan,
          billingCycle,
          countryCode: userCountry,
          returnUrl: `${window.location.origin}/billing/success`,
          cancelUrl: `${window.location.origin}/billing/cancel`,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to initiate checkout");
      }

      const { checkoutUrl } = await response.json();

      // Redirect to payment provider
      window.location.href = checkoutUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
      setIsLoading(false);
    }
  };

  const selectedPlanData = PLANS.find((p) => p.id === selectedPlan)!;

  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
          <p className="text-gray-400 text-lg">
            Upgrade your account and unlock unlimited AI-powered features
          </p>
        </div>

        {/* Billing Cycle Toggle */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-6 py-2 rounded font-medium transition-colors ${
                billingCycle === "monthly"
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle("annual")}
              className={`px-6 py-2 rounded font-medium transition-colors ${
                billingCycle === "annual"
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Annual
              <span className="ml-2 text-xs bg-green-600 px-2 py-1 rounded">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              className={`cursor-pointer rounded-lg border-2 transition-all p-6 ${
                selectedPlan === plan.id
                  ? "border-blue-600 bg-gray-800"
                  : "border-gray-700 bg-gray-900 hover:border-gray-600"
              }`}
            >
              <div className="flex items-center mb-4">
                <input
                  type="radio"
                  checked={selectedPlan === plan.id}
                  onChange={() => setSelectedPlan(plan.id)}
                  className="w-4 h-4 accent-blue-600"
                />
                <h3 className="text-xl font-bold ml-3">{plan.name}</h3>
              </div>

              <div className="mb-6">
                <div className="text-2xl font-bold mb-1">
                  {billingCycle === "monthly"
                    ? plan.monthlyPrice.split(" / ")[0]
                    : plan.annualPrice.split(" / ")[0]}
                </div>
                <div className="text-gray-400 text-sm">
                  {billingCycle === "monthly" ? "/month" : "/year"}
                </div>
              </div>

              <div className="flex items-center gap-2 mb-6 pb-6 border-b border-gray-700">
                <span className="text-2xl">⚡</span>
                <span className="text-lg font-semibold">
                  {plan.credits.toLocaleString()} credits/month
                </span>
              </div>

              <ul className="space-y-3">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span className="text-sm text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="max-w-2xl mx-auto mb-6 bg-red-900/30 border border-red-600 rounded-lg p-4 text-red-200">
            {error}
          </div>
        )}

        {/* Checkout Button */}
        <div className="flex justify-center">
          <button
            onClick={handleCheckout}
            disabled={isLoading}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold text-lg transition-colors flex items-center gap-2"
          >
            {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
            {isLoading ? "Redirecting to payment..." : "Continue to Payment"}
          </button>
        </div>

        {/* Info */}
        <div className="text-center mt-8 text-gray-400 text-sm">
          <p>
            All plans include a 14-day free trial. Cancel anytime, no questions
            asked.
          </p>
          <p className="mt-2">
            Paying from {userCountry === "ZA" ? "South Africa" : "your country"}
          </p>
        </div>
      </div>
    </div>
  );
}
