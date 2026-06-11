"use client";

import { useEffect, useState } from "react";
import { CheckIcon, ArrowRightIcon } from "lucide-react";
import { PlanCard } from "./home/PlanCard";
import { BillingToggle, type BillingCycle } from "./home/BillingToggle";
import { TrustedBy } from "./home/TrustedBy";

type CurrencyData = {
  currency: string;
  rate: number;
};

const ANNUAL_DISCOUNT = 0.15;

export function Pricing() {
  const [currencyData, setCurrencyData] = useState<CurrencyData>({
    currency: "USD",
    rate: 1,
  });
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [loadingCurrency, setLoadingCurrency] = useState(true);

  useEffect(() => {
    fetch("/api/currency")
      .then((r) => r.json())
      .then((data: CurrencyData) => setCurrencyData(data))
      .catch(() => {}) // silently falls back to USD
      .finally(() => setLoadingCurrency(false));
  }, []);

  const plans = buildPlans(currencyData, billingCycle);

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 py-24 flex flex-col items-center">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-12">
          <h1 className="text-5xl tracking-tight text-white">
            Choose the best plan for you
          </h1>
          <BillingToggle value={billingCycle} onChange={setBillingCycle} />
          {loadingCurrency && (
            <p className="text-white/40 text-xs mt-3">
              Detecting your currency…
            </p>
          )}
        </div>

        {/* Plan cards */}
        <div className="flex max-w-7xl gap-2 items-stretch text-white w-full flex-wrap md:flex-nowrap justify-center">
          {plans.map((plan) => (
            <PlanCard
              key={plan.name}
              plan={plan}
              currency={currencyData.currency}
              annual={billingCycle === "annually"}
            />
          ))}
        </div>

        {/* Enterprise banner */}
        <div className="bg-white/10 max-w-7xl w-full text-white/80 text-sm mt-10 px-10 py-10 rounded-md flex items-center justify-between gap-8 flex-wrap">
          <div className="flex flex-col gap-2 shrink-0">
            <p className="text-white font-medium text-xl tracking-tight">
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
              Join the waitlist <ArrowRightIcon className="w-4.5 h-4.5" />
            </button>
          </div>

          <div className="w-px self-stretch bg-white/10 shrink-0" />

          <div className="flex flex-col gap-1.5">
            <p className="text-white/40 text-[11px] uppercase mb-1">
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

        {/* Trusted by */}
        <div className="max-w-7xl tracking-tight mx-auto mt-20 mb-10 text-white/80 text-center px-4">
          <p>Empowering production grade creative work at:</p>
          <TrustedBy />
        </div>
      </div>
    </div>
  );
}

// Identical to CreditsBadge — kept co-located so Pricing is self-contained
// if you ever want to diverge plans between the two surfaces.
function buildPlans(currency: CurrencyData, billingCycle: BillingCycle) {
  const discount = billingCycle === "annually" ? ANNUAL_DISCOUNT : 0;
  const fmt = (usd: number) =>
    formatPrice(usd * (1 - discount), currency.currency, currency.rate);

  return [
    {
      name: "Free",
      price: fmt(0),
      popular: false,
      description:
        "Explore AI-powered creation with chat, canvas, and generation tools.",
      credits: {
        amount: "100 monthly credits",
        equivalence: "=100 AI actions",
      },
      features: [
        "Access to core AI models",
        "Basic image and website generation",
        "3 active workflows",
        "Limited workflow history",
        "Community asset browsing",
      ],
      isCurrent: true,
    },
    {
      name: "Starter",
      popular: false,
      price: fmt(15),
      description:
        "For creators and students building projects with AI every day.",
      credits: {
        amount: "1,000 monthly credits",
        equivalence: "=1,000 AI actions",
      },
      features: [
        "Access to all standard AI models",
        "Advanced canvas and editing tools",
        "20 active workflows",
        "Full workflow history",
        "Priority generation speeds",
        "Import assets from shared workspaces",
      ],
      isCurrent: false,
      onSelect: () => console.log("upgrade to starter"),
    },
    {
      name: "Pro",
      popular: true,
      price: fmt(35),
      description:
        "Built for advanced creators shipping products, designs, and AI workflows.",
      credits: {
        amount: "5,000 monthly credits",
        equivalence: "=5,000 AI actions",
      },
      features: [
        "Access to premium reasoning models",
        "Fastest AI processing speeds",
        "Unlimited workflows",
        "Version history and restore",
        "Voice, image, and web agents",
        "Shared asset libraries",
        "Early access AI features",
      ],
      isCurrent: false,
      onSelect: () => console.log("upgrade to pro"),
    },
    {
      name: "Ultra",
      popular: false,
      price: fmt(79),
      description:
        "High-compute plan for heavy AI usage and large creative pipelines.",
      credits: {
        amount: "20,000 monthly credits",
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
      onSelect: () => console.log("upgrade to ultra"),
    },
  ];
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
