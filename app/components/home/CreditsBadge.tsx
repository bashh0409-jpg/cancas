"use client";

import { useEffect, useState } from "react";
import { X, CheckIcon, ArrowRightIcon } from "lucide-react";
import { PlanCard } from "./PlanCard";
import { BillingToggle, type BillingCycle } from "./BillingToggle";
import { TrustedBy } from "./TrustedBy";

type CurrencyData = {
  currency: string;
  rate: number;
};

type CreditsBadgeProps = {
  credits: number;
  className?: string;
};

export function CreditsBadge({ credits, className }: CreditsBadgeProps) {
  const [open, setOpen] = useState(false);
  const [currencyData, setCurrencyData] = useState<CurrencyData>({
    currency: "USD",
    rate: 1,
  });
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [loadingCurrency, setLoadingCurrency] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  // Fetch once on first open, then cache in state for the session
  useEffect(() => {
    if (!open || currencyData.rate !== 1 || currencyData.currency !== "USD") {
      return;
    }

    async function loadCurrency() {
      setLoadingCurrency(true);

      try {
        const response = await fetch("/api/currency");
        const data: CurrencyData = await response.json();
        setCurrencyData(data);
      } catch {
        // already defaults to USD on API failure
      } finally {
        setLoadingCurrency(false);
      }
    }

    loadCurrency();
  }, [open, currencyData.currency, currencyData.rate]);

  async function initiateCheckout(planId: string) {
    try {
      const countryCode = currencyData.currency === "ZAR" ? "ZA" : "US";
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: planId,
          billingCycle,
          countryCode,
          returnUrl: `${window.location.origin}/billing/success`,
          cancelUrl: `${window.location.origin}/billing/cancel`,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to start checkout");
      }

      const { checkoutUrl } = await res.json();
      if (checkoutUrl) window.location.href = checkoutUrl;
    } catch (err) {
      console.error("Checkout initiation failed:", err);
      alert(err instanceof Error ? err.message : "Checkout failed");
    }
  }

  const plans = buildPlans(currencyData, billingCycle, initiateCheckout);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={[
          "flex items-center gap-1 cursor-pointer bg-white/20 border-2 border-white/5 h-6 px-1 rounded-xs text-white uppercase text-xs tracking-tight",
          "hover:bg-white/40 transition",
          className ?? "",
        ].join(" ")}
      >
        <Icon />
        <span className="text-sm h-3 leading-none">{credits}</span>
        <span className="text-white text-xs  hidden leading-none">credits</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[999] bg-black backdrop-blur-md">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute right-8 cursor-pointer top-8 text-white/80 hover:text-white"
          >
            <X size={30} />
          </button>

          <div className="grid place-items-center h-full px-4 overflow-y-auto">
            <div className="flex flex-col items-center mt-30 mb-30 text-center">
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

            <div className="flex max-w-7xl gap-2 items-stretch text-white w-full wrap">
              {plans.map((plan) => (
                <PlanCard
                  key={plan.name}
                  plan={plan}
                  currency={currencyData.currency}
                  annual={billingCycle === "annually"}
                />
              ))}
            </div>

            <div className="bg-white/10 max-w-7xl w-full text-white/80 text-sm mt-10 px-30 py-10 rounded-md flex items-center justify-between gap-8">
              <div className="flex flex-col gap-2 shrink-0">
                <p className="text-white font-medium text-xl tracking-tight">
                  Need more than Ultra?
                </p>
                <p className="text-white/50 text-xs leading-relaxed max-w-64">
                  Enterprise is coming soon. Join the waitlist and we&apos;ll
                  reach out as soon as it&apos;s ready.
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

            <div className="max-w-7xl mx-auto mt-20 mb-40 text-white/80 text-center px-4">
              <p>Empowering production grade creative work at:</p>
              <div>
                <TrustedBy />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Keeps plan data co-located and reactive to currency changes
function buildPlans(
  currency: CurrencyData,
  billingCycle: BillingCycle,
  initiateCheckout: (planId: string) => Promise<void>,
) {
  const discount = billingCycle === "annually" ? 0.15 : 0;
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
      onSelect: () => initiateCheckout("starter"),
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
      onSelect: () => initiateCheckout("pro"),
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
      onSelect: () => initiateCheckout("ultra"),
    },
  ];
}

function formatPrice(
  usdAmount: number,
  currency: string,
  rate: number,
): string {
  const converted = usdAmount * rate;

  // Intl.NumberFormat handles symbol, decimal rules, and rounding per locale.
  // Use it for zero too so free plans still respect local currency formatting.
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    maximumFractionDigits: 0, // no cents — cleaner for pricing pages
  }).format(converted);
}

function Icon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 3.75V20.25" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4.5 7.5L19.5 16.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4.5 16.5L19.5 7.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
