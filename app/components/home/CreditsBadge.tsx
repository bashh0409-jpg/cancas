"use client";

import { useState } from "react";

type CreditsBadgeProps = {
  credits: number;
  className?: string;
};

export function CreditsBadge({ credits, className }: CreditsBadgeProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={[
          "flex items-center gap-1 bg-white/10 h-8 px-2 rounded-md text-white pixel",
          "hover:bg-white/15 transition",
          className ?? "",
        ].join(" ")}
      >
        <Icon />

        <span className="text-sm leading-none">
          {credits}
        </span>

        <span className="text-white/80 text-sm leading-none">credits</span>
      </button>

      {/* Overlay */}
      {open && (
        <div className="fixed inset-0 z-[999] bg-black/80 backdrop-blur-md flex items-center justify-center">
          <div className="relative w-full max-w-4xl mx-4 rounded-2xl border border-white/10 bg-zinc-950 p-6 text-white shadow-2xl">
            {/* Close */}
            <button
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4 h-9 w-9 rounded-md border border-white/10 bg-white/5 hover:bg-white/10 transition"
              aria-label="Close plans"
            >
              ✕
            </button>

            {/* Header */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold tracking-tight">
                Choose your plan
              </h2>
              <p className="text-white/60 text-sm mt-1">
                Upgrade to unlock more creation power
              </p>
            </div>

            {/* Plans */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <PlanCard
                title="Free"
                price="R0"
                features={["Limited credits", "Basic canvas tools"]}
                cta="Current Plan"
                disabled
              />

              <PlanCard
                title="Pro"
                price="R99/mo"
                features={[
                  "More credits",
                  "High quality exports",
                  "Priority processing",
                ]}
                cta="Upgrade"
                highlight
              />

              <PlanCard
                title="Studio"
                price="R199/mo"
                features={[
                  "Unlimited workflows",
                  "Advanced AI tools",
                  "Team features",
                ]}
                cta="Upgrade"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
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
      <path
        d="M12 3.75V20.25"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M4.5 7.5L19.5 16.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M4.5 16.5L19.5 7.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

type PlanCardProps = {
  title: string;
  price: string;
  features: string[];
  cta: string;
  highlight?: boolean;
  disabled?: boolean;
};

function PlanCard({
  title,
  price,
  features,
  cta,
  highlight,
  disabled,
}: PlanCardProps) {
  return (
    <div
      className={[
        "rounded-xl border p-4 flex flex-col gap-3",
        "bg-white/5 border-white/10",
        highlight ? "ring-2 ring-blue-500/40" : "",
      ].join(" ")}
    >
      <div>
        <div className="text-sm font-semibold">{title}</div>
        <div className="text-white/70 text-sm">{price}</div>
      </div>

      <ul className="text-xs text-white/60 space-y-1">
        {features.map((f) => (
          <li key={f}>• {f}</li>
        ))}
      </ul>

      <button
        disabled={disabled}
        className={[
          "mt-auto h-9 rounded-md text-sm font-medium transition",
          disabled
            ? "bg-white/10 text-white/40 cursor-not-allowed"
            : "bg-blue-50text-white",
        ].join(" ")}
      >
        {cta}
      </button>
    </div>
  );
}
