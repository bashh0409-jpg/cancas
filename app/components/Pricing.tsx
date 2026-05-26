import Link from "next/link";
import React from "react";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "/ month",
    desc: "For individuals getting started.",
    cta: "Get started",
    href: "/signup",
    featured: false,
    features: [
      "3 active canvases",
      "50 AI credits / mo",
      "PNG export",
      "7-day version history",
    ],
  },
  {
    name: "Pro",
    price: "$20",
    period: "/ month",
    desc: "Full AI access and unlimited exports.",
    cta: "Start Pro",
    href: "/signup",
    featured: true,
    badge: "Most popular",
    features: [
      "Unlimited canvases",
      "500 AI credits / mo",
      "PNG, SVG, PDF export",
      "30-day version history",
      "Comments & feedback",
    ],
  },
  {
    name: "Pro+",
    price: "$60",
    period: "/ month",
    desc: "Higher AI volume and priority support.",
    cta: "Start Pro+",
    href: "/signup",
    featured: false,
    features: [
      "Everything in Pro",
      "2,000 AI credits / mo",
      "90-day version history",
      "Priority support",
    ],
  },
  {
    name: "Ultra",
    price: "$200",
    period: "/ month",
    desc: "For studios running design at scale.",
    cta: "Contact us",
    href: "/contact",
    featured: false,
    features: [
      "Everything in Pro+",
      "Unlimited AI credits",
      "Unlimited history",
      "Dedicated support",
      "Custom brand kit",
    ],
  },
];

function Check() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0 text-white/40"
    >
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}

export default function Pricing() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-24 sm:px-8">
      <div className="border-t border-white/[0.06] pt-24">
        <p className="pixel text-xs font-semibold uppercase tracking-widest text-white/30">
          Pricing
        </p>
        <h2 className="pixel mt-3 text-3xl font-semibold tracking-tight text-white sm:text-5xl">
          Start free, scale
          <br />
          when you&apos;re ready.
        </h2>
        <p className="mt-4 max-w-xl text-sm text-white/50 sm:text-base">
          Every plan includes core design tools. AI features unlock as you grow.
        </p>

        <div className="mt-12 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={[
                "flex flex-col gap-5 rounded-xl border p-5 transition",
                plan.featured
                  ? "border-white/30 bg-white/[0.04]"
                  : "border-white/[0.06] bg-white/[0.02]",
              ].join(" ")}
            >
              <div className="flex flex-col gap-1">
                {plan.badge && (
                  <span className="mb-1 inline-block self-start rounded-full border border-white/10 bg-white/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/60">
                    {plan.badge}
                  </span>
                )}
                <div className="pixel text-sm font-semibold text-white">
                  {plan.name}
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="pixel text-3xl font-semibold text-white">
                    {plan.price}
                  </span>
                  <span className="text-xs text-white/30">{plan.period}</span>
                </div>
                <p className="text-xs text-white/40">{plan.desc}</p>
              </div>

              <ul className="flex flex-1 flex-col gap-2">
                {plan.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-center gap-2 text-xs text-white/50"
                  >
                    <Check />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className={[
                  "rounded-full px-4 py-2 text-center text-xs font-semibold tracking-tight transition",
                  plan.featured
                    ? "bg-white text-black hover:bg-white/85"
                    : "border border-white/10 text-white/70 hover:border-white/20 hover:text-white",
                ].join(" ")}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
