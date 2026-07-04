// components/PricingPlans.tsx
"use client";

import { useState } from "react";

type BillingCycle = "monthly" | "annual";

interface Plan {
  name: string;
  monthlyPrice: number | null; // null = free
  description: string;
  credits: {
    amount: string;
    equivalence: string;
  };
  features: string[];
  isCurrent?: boolean;
  featured?: boolean;
  onSelect?: () => void;
}

const DISCOUNT = 0.15;

const PLANS: Plan[] = [
  {
    name: "Free",
    monthlyPrice: null,
    description: "Explore the basics and start creating simple canvases.",
    credits: {
      amount: "50 monthly credits",
      equivalence: "≈ 375 images per canvas",
    },
    features: [
      "Access to all AI models",
      "Professional-grade editing tools",
      "5 workflows",
      "No workflow history",
    ],
    isCurrent: true,
  },
  {
    name: "Pro",
    monthlyPrice: 15,
    description: "Enhanced capabilities for professionals and small teams.",
    credits: {
      amount: "500 monthly credits",
      equivalence: "≈ 1,250 images per canvas",
    },
    features: [
      "All AI models with priority processing",
      "Advanced editing with version history",
      "20 workflows with unlimited history",
      "Collaboration features for teams",
    ],
    featured: true,
    onSelect: () => console.log("upgrade to pro"),
  },
  {
    name: "Pro+",
    monthlyPrice: 25,
    description: "More power and resources for growing studios and creators.",
    credits: {
      amount: "1,000 monthly",
      equivalence: "≈ 2,500 images per canvas",
    },
    features: [
      "All AI models with priority processing",
      "Advanced editing with version history",
      "50 workflows with unlimited history",
      "Collaboration features for teams",
    ],
    onSelect: () => console.log("upgrade to pro+"),
  },
  {
    name: "Ultra",
    monthlyPrice: 40,
    description: "Maximum output for high-volume production and large teams.",
    credits: {
      amount: "2,000 monthly",
      equivalence: "≈ 5,000 images per canvas",
    },
    features: [
      "Dedicated AI model access",
      "Enterprise editing + team management",
      "Unlimited workflows + analytics",
      "Priority support + onboarding",
    ],
    onSelect: () => console.log("upgrade to ultra"),
  },
];

export function PricingPlans() {
  const [billing, setBilling] = useState<BillingCycle>("monthly");
  const annual = billing === "annual";

  function getPrice(plan: Plan): number | null {
    if (plan.monthlyPrice === null) return null;
    return annual
      ? Math.round(plan.monthlyPrice * (1 - DISCOUNT))
      : plan.monthlyPrice;
  }

  return (
    <div className="flex flex-col items-center">
      {/* Billing toggle */}
      <div className="flex items-center gap-0 bg-white/10 border border-white/10 rounded-xl p-1 mb-8">
        <button
          onClick={() => setBilling("monthly")}
          className={`px-4 py-1.5 rounded-lg text-sm transition-all ${
            billing === "monthly"
              ? "bg-white/15 text-white font-medium"
              : "text-white/50 hover:text-white/80"
          }`}
        >
          Monthly
        </button>
        <button
          onClick={() => setBilling("annual")}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm transition-all ${
            billing === "annual"
              ? "bg-white/15 text-white font-medium"
              : "text-white/50 hover:text-white/80"
          }`}
        >
          Annually
          <span className="bg-emerald-400/20 text-emerald-300 text-[11px] font-medium px-2 py-0.5 rounded-full">
            -15%
          </span>
        </button>
      </div>

      {/* Cards */}
      <div className="flex gap-2 items-stretch">
        {PLANS.map((plan) => (
          <PlanCard
            key={plan.name}
            plan={plan}
            price={getPrice(plan)}
            annual={annual}
          />
        ))}
      </div>
    </div>
  );
}

interface PlanCardProps {
  plan: Plan;
  price: number | null;
  annual: boolean;
  className?: string;
}

function PlanCard({ plan, price, annual, className = "" }: PlanCardProps) {
  const {
    name,
    description,
    credits,
    features,
    isCurrent,
    featured,
    onSelect,
  } = plan;

  return (
    <div
      className={`
        bg-white/10 backdrop-blur-md border p-5 rounded-xl text-white flex flex-col w-56
        ${featured ? "border-blue-400/50" : "border-white/5"}
        ${className}
      `}
    >
      {/* Featured badge */}
      <div className="mb-3 h-6 flex items-center">
        {featured ? (
          <span className="text-[11px] font-medium bg-blue-400/15 text-blue-300 px-2.5 py-0.5 rounded-full">
            Most popular
          </span>
        ) : null}
      </div>

      {/* Header */}
      <p className="text-sm font-medium mb-1">{name}</p>
      <p className="text-xs text-white/50 leading-relaxed mb-4">
        {description}
      </p>

      {/* Price */}
      <div className="flex items-baseline gap-1 mb-1">
        <span className="text-3xl font-medium">
          {price === null ? "$0" : `$${price}`}
        </span>
        <span className="text-xs text-white/50">/ mo</span>
      </div>

      {/* Annual billing line — always reserve the space so cards stay aligned */}
      <p className="text-[11px] text-white/40 mb-4 h-4">
        {annual && price !== null ? `Billed $${price * 12} / year` : ""}
      </p>

      {/* CTA */}
      {isCurrent ? (
        <button
          disabled
          className="w-full py-2 rounded-lg text-xs font-medium bg-white/5 text-white/30 cursor-not-allowed"
        >
          Current plan
        </button>
      ) : (
        <button
          onClick={onSelect}
          className={`w-full py-2 rounded-lg text-xs font-medium transition-all ${
            featured
              ? "bg-white text-black hover:bg-white/90"
              : "bg-white/10 text-white hover:bg-white/20"
          }`}
        >
          Upgrade to {name}
        </button>
      )}

      <hr className="border-white/10 my-4" />

      {/* Credits */}
      <div className="flex items-start gap-2 mb-4">
        <BoltIcon />
        <div>
          <p className="text-xs text-white">{credits.amount}</p>
          <p className="text-[11px] text-white/40 mt-0.5">
            {credits.equivalence}
          </p>
        </div>
      </div>

      {/* Features */}
      <div className="flex flex-col gap-2.5 flex-1">
        {features.map((text) => (
          <div
            key={text}
            className="flex items-start gap-2 text-xs text-white/60 leading-relaxed"
          >
            <CheckIcon />
            <span>{text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BoltIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 mt-0.5 text-white/40"
    >
      <path
        d="M13 2L4.5 13.5H11.5L10.5 22L19.5 10H12.5L13 2Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-white/50 shrink-0 mt-0.5"
    >
      <path
        d="M14.354 4.85403L6.35403 12.854C6.30759 12.9005 6.25245 12.9374 6.19175 12.9626C6.13105 12.9877 6.06599 13.0007 6.00028 13.0007C5.93457 13.0007 5.86951 12.9877 5.80881 12.9626C5.74811 12.9374 5.69296 12.9005 5.64653 12.854L2.14653 9.35403C2.05271 9.26021 2 9.13296 2 9.00028C2 8.8676 2.05271 8.74035 2.14653 8.64653C2.24035 8.55271 2.3676 8.5 2.50028 8.5C2.63296 8.5 2.76021 8.55271 2.85403 8.64653L6.00028 11.7934L13.6465 4.14653C13.7403 4.05271 13.8676 4 14.0003 4C14.133 4 14.2602 4.05271 14.354 4.14653C14.4478 4.24035 14.5006 4.3676 14.5006 4.50028C14.5006 4.63296 14.4478 4.76021 14.354 4.85403Z"
        fill="currentColor"
      />
    </svg>
  );
}
