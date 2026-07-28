"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckIcon, ArrowRightIcon, X } from "lucide-react";
import { PlanCard } from "@/app/components/home/PlanCard";
import { BillingToggle, type BillingCycle } from "@/app/components/home/BillingToggle";

type CurrencyData = {
  currency: string;
  rate: number;
};

interface CheckoutPageProps {
  userCountry: string;
  userEmail: string;
}

export function CheckoutPage({ userCountry }: CheckoutPageProps) {
  const router = useRouter();
  const [currencyData, setCurrencyData] = useState<CurrencyData>({
    currency: "USD",
    rate: 1,
  });
  const [selectedPlan, setSelectedPlan] = useState<"starter" | "pro" | "ultra">("pro");
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingCurrency, setLoadingCurrency] = useState(true);
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/currency")
      .then((r) => r.json())
      .then((data: CurrencyData) => setCurrencyData(data))
      .catch(() => {})
      .finally(() => setLoadingCurrency(false));
  }, []);

  const startCheckout = useCallback(
    async (plan: "starter" | "pro" | "ultra") => {
      if (pendingKey) return;

      const key = crypto.randomUUID();
      setPendingKey(key);
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/billing/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            plan,
            billingCycle,
            countryCode: userCountry,
            returnUrl: `${window.location.origin}/billing/success`,
            cancelUrl: `${window.location.origin}/billing/cancel`,
            idempotencyKey: key,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to initiate checkout");
        }

        const { checkoutUrl } = await response.json();
        window.location.href = checkoutUrl;
      } catch (err) {
        setPendingKey(null);
        setError(err instanceof Error ? err.message : "Checkout failed");
        setIsLoading(false);
      }
    },
    [billingCycle, userCountry, pendingKey],
  );

  const selectPlan = useCallback(
    (plan: "starter" | "pro" | "ultra") => {
      setSelectedPlan(plan);
      startCheckout(plan);
    },
    [startCheckout],
  );

  const fmt = useCallback(
    (usd: number) => formatPrice(usd, currencyData.currency, currencyData.rate),
    [currencyData.currency, currencyData.rate],
  );

  function getPlans() {
    return [
      {
        name: "Starter",
        price: fmt(15),
        popular: selectedPlan === "starter",
        description:
          "For creators and students building projects with AI every day.",
        credits: {
          amount: "1,000 monthly",
          equivalence: "=1,000 AI actions",
        },
        features: [
          "Access to all standard AI models",
          "Advanced canvas and editing tools",
          "Unlimited active workflows",
          "Full workflow history",
          "Priority generation speeds",
          "Import assets from shared workspaces",
        ],
        isCurrent: false,
        onSelect: () => selectPlan("starter"),
        ctaLabel: "Choose Starter",
      },
      {
        name: "Pro",
        price: fmt(35),
        popular: selectedPlan === "pro",
        description:
          "Built for advanced creators shipping products, designs, and AI workflows.",
        credits: {
          amount: "5,000 monthly",
          equivalence: "=5,000 AI actions",
        },
        features: [
          "Access to premium reasoning models",
          "Fastest AI processing speeds",
          "Unlimited active workflows",
          "Version history and restore",
          "Voice, image, and web agents",
          "Shared asset libraries",
          "Early access AI features",
        ],
        isCurrent: false,
        onSelect: () => selectPlan("pro"),
        ctaLabel: "Choose Pro",
      },
      {
        name: "Ultra",
        price: fmt(79),
        popular: selectedPlan === "ultra",
        description:
          "High-compute plan for heavy AI usage and large creative pipelines.",
        credits: {
          amount: "20,000 monthly",
          equivalence: "=12,000 AI actions",
        },
        features: [
          "Everything in Pro",
          "Highest priority compute",
          "Large shared asset storage",
          "Advanced workflow automations",
          "Experimental AI systems",
          "Premium support",
          "Future collaboration features",
        ],
        isCurrent: false,
        onSelect: () => selectPlan("ultra"),
        ctaLabel: "Choose Ultra",
      },
    ];
  }

  return (
    <div className="min-h-screen bg-black text-white scrollbar-hidden overflow-x-hidden">
      <a
        href="/manage"
        className="w-fit absolute top-2 left-2 p-2 lime flex items-center justify-center rounded text-black uppercase tracking-tight text-xs"
        aria-label="Go back"
      >
        <X className="w-4 h-4" />
      </a>
      <div className="max-w-7xl scrollbar-hidden mx-auto px-4 py-24 flex flex-col items-center">
        {/* Header */}
        <div className="flex flex-col scrollbar-hidden items-center text-center mb-12">
          <h1 className="text-xl tracking-tight uppercase mono text-white">
            Choose your plan
          </h1>
          <p className="text-white/40 max-w-md mono uppercase text-xs mt-3">
            Upgrade your account and unlock unlimited AI-powered features
          </p>

          <BillingToggle value={billingCycle} onChange={setBillingCycle} />
          {loadingCurrency && (
            <p className="text-white/40 grotesk text-xs mt-3">
              Detecting your currency…
            </p>
          )}
        </div>

        {/* Plan cards */}
        <div className="flex max-w-7xl gap-2 items-stretch text-white w-full flex-wrap md:flex-nowrap justify-center">
          {getPlans().map((plan) => (
            <PlanCard
              key={plan.name}
              plan={plan}
              currency={currencyData.currency}
              annual={billingCycle === "annually"}
            />
          ))}
        </div>

        {/* Error message */}
        {error && (
          <div className="max-w-2xl mx-auto mt-6 bg-red-900/30 border border-red-600 rounded-lg p-4 text-red-200 text-xs mono">
            {error}
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center mt-8">
            <Loader2 className="w-5 h-5 animate-spin text-white/60" />
            <span className="ml-2 text-xs mono text-white/60">
              Redirecting to payment...
            </span>
          </div>
        )}
        <div className="bg-white/10 max-w-7xl w-full text-white/80 text-sm mt-10 px-30 py-10 rounded-md flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col gap-2 shrink-0">
            <p className="text-white mono uppercase text-xl tracking-tight">
              Need more than Ultra?
            </p>
            <p className="text-white/50 text-xs leading-relaxed max-w-64">
              Enterprise is coming soon. Join the waitlist and we&apos;ll reach
              out as soon as it&apos;s ready.
            </p>
            <button
              onClick={() => console.log("contact sales")}
              className="mt-1 w-fit flex items-center gap-1 text-xs bg-white/10 hover:bg-white/15 transition text-white px-4 py-2 rounded-md"
            >
              Join the waitlist{" "}
              <span>
                <ArrowRightIcon className="w-4.5 h-4.5" />
              </span>
            </button>
          </div>

          <div className="w-px self-stretch bg-white/10 shrink-0" />

          <div className="flex flex-col gap-1.5">
            <p className="text-white/40 mono text-[11px] uppercase mb-1">
              Enterprise includes everything in Ultra, plus
            </p>
            {[
              { label: "Custom credit allocation" },
              { label: "Team training" },
              { label: "Premium customer support on Slack" },
              { label: "Your own API keys" },
              { label: "Run workflows through API", soon: true },
            ].map(({ label, soon }) => (
              <div
                key={label}
                className="flex items-center gap-2 text-xs text-white/70"
              >
                <CheckIcon className="w-4.5 h-4.5" />
                <span>{label}</span>
                {soon && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 text-white/40 leading-none">
                    coming soon
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function formatPrice(
  usdAmount: number,
  currency: string,
  rate: number,
): string {
  const converted = usdAmount * rate;

  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(converted);
}