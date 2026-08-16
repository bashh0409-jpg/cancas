//
//  page.tsx  (privacy policy)
//
//
//  Created by Wandile Langa on 2026/08/16.
//

"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

// ── Fill these in — keep in sync with the Terms of Service file. ─────
const CONFIG = {
  companyName: "Wandile Langa",
  productName: "Reflow",
  contactEmail: "privacy@swipes.site", // update to your real inbox
  domain: "www.swipes.site",
  effectiveDate: "16 August 2026",
  jurisdiction:
    "South Africa, and we comply with the Protection of Personal Information Act (POPIA). If you're outside South Africa, we also apply GDPR-equivalent principles.",
};

const sections = [
  {
    id: "overview",
    title: "Overview",
    body: [
      `This policy explains what personal information ${CONFIG.productName} ("we", "us") collects, why we collect it, and how you can control it. It applies to ${CONFIG.domain} and the ${CONFIG.productName} app.`,
      `We are based in ${CONFIG.jurisdiction}`,
    ],
  },
  {
    id: "sign-in",
    title: "Signing in",
    body: [
      "You can create a Reflow account using Google, or Figma sign-in. Whichever method you choose, we only receive your basic profile — name, email address, and profile photo — to create and authenticate your account. We never receive your password for these providers; the sign-in happens directly with them.",
      "We do not request access to your Gmail, Google Calendar, Figma files as part of sign-in. Sign-in scopes are limited to identity only: Google's openid/email/profile scopes and Figma's current_user:read scope.",
    ],
  },
  {
    id: "drive-integrations",
    title: "Google Drive, Dropbox",
    body: [
      "If you choose to connect Google Drive, or Dropbox to import assets into Reflow or export your projects, we request access limited to the specific files you create with Reflow or explicitly select yourself through the provider's own file picker.",
      "For Google Drive specifically, we use the drive.file scope, which by design cannot see or touch any file in your Drive other than ones Reflow created or you picked. We don't have blanket read access to your Drive, or Dropbox account.",
      "You can disconnect any of these integrations at any time from your account settings, or by revoking access directly from the provider (e.g. myaccount.google.com/permissions for Google).",
    ],
  },
  {
    id: "collect",
    title: "Information we collect",
    body: [
      "Account information: name, email, and profile photo from your chosen sign-in method, or the details you provide if you sign up with email.",
      "Content you create: canvases, boards, images, video, and other assets you generate or upload inside Reflow.",
      "Files you explicitly import or export via connected storage providers (Drive, Dropbox), if you use that feature.",
      "Usage data: pages visited, features used, and basic device/browser information, collected via PostHog, so we can understand how the product is used and fix bugs.",
      "Technical/error data: automatically captured crash reports and error logs via Sentry, and performance metrics via Vercel Analytics and Speed Insights.",
      "Billing information: if you subscribe to a paid plan, our payment processors (Stripe, Polar, or PayFast, depending on your region) handle your card details directly — we receive only your subscription status and transaction history, never your full card number.",
    ],
  },
  {
    id: "ai-processing",
    title: "AI-generated content",
    body: [
      "When you use Reflow's generation features (creating images, removing backgrounds, upscaling, or generating titles), your prompts and reference assets are sent to third-party AI model providers to produce the output, then returned to your canvas.",
      "We don't use your prompts or generated content to train third-party foundation models, and we don't sell this data. Retention at the AI provider level follows their own processing terms, which are limited to fulfilling your request.",
    ],
  },
  {
    id: "video-search",
    title: "Video hosting & stock image search",
    body: [
      "Video you upload or generate is hosted and streamed via Mux. Mux processes and stores video files on our behalf under a data processing agreement; it does not use your content for its own purposes.",
      "If you search for stock images inside Reflow, your search terms are sent to Unsplash's API to return results. We don't store your Unsplash search history beyond what's needed to display results.",
    ],
  },
  {
    id: "use",
    title: "How we use it",
    body: [
      "To create and maintain your account, and authenticate you on future visits, regardless of which sign-in method you use.",
      "To operate the core product — saving, organizing, generating, and rendering your canvas and assets.",
      "To process payments and manage subscriptions through our billing providers.",
      "To monitor performance, diagnose errors, and improve the product using aggregated usage data.",
      "To send account-related emails (sign-in alerts, billing receipts, policy changes). We won't send marketing email without a separate opt-in.",
    ],
  },
  {
    id: "sharing",
    title: "Sharing and disclosure",
    body: [
      "We don't sell personal information. We share data only with the service providers that operate Reflow on our behalf — Supabase (database and authentication), Vercel (hosting), Mux (video), our AI model providers (generation), Unsplash (stock search), and our payment processors (billing) — each under terms that limit them to processing data for us, not their own purposes.",
      "We may disclose information if required by law, or to protect the rights, safety, or property of our users or the public.",
    ],
  },
  {
    id: "retention",
    title: "Data retention",
    body: [
      "We keep your account data for as long as your account is active. If you delete your account, we remove your personal information within 30 days, except where we're required to retain it for legal, tax, or security reasons (for example, billing records).",
    ],
  },
  {
    id: "rights",
    title: "Your rights",
    body: [
      "You can access, correct, or delete your account information at any time from your account settings, or by contacting us directly.",
      "You can revoke Reflow's access to any connected provider (Google, Figma, Drive, Dropbox) at any time from that provider's own permissions page, or from your Reflow account settings.",
      "You can ask us what data we hold about you, and request that we delete it, subject to legal retention requirements.",
    ],
  },
  {
    id: "cookies",
    title: "Cookies & tracking",
    body: [
      "We use essential cookies to keep you signed in and remember basic preferences. We use PostHog, Vercel Analytics, and Vercel Speed Insights for product analytics, and Sentry for error monitoring. We don't use third-party advertising cookies.",
    ],
  },
  {
    id: "children",
    title: "Children's privacy",
    body: [
      `${CONFIG.productName} is not directed at children under 13 (or the minimum age required in your country), and we don't knowingly collect their data. If you believe a child has created an account, contact us and we'll remove it.`,
    ],
  },
  {
    id: "changes",
    title: "Changes to this policy",
    body: [
      "If we make material changes, we'll update the effective date below and, where appropriate, notify you by email or in-product before the change takes effect.",
    ],
  },
  {
    id: "contact",
    title: "Contact",
    body: [`Questions about this policy or your data: ${CONFIG.contactEmail}.`],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <div className="relative min-h-screen bg-[#101010] text-white">
      <header className="fixed z-30 flex w-full items-center justify-between p-4 font-mono text-sm font-medium uppercase">
        <Link
          href="/"
          className="flex items-center gap-2 text-white transition-colors hover:text-white"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <img
          src="/images/Re.svg"
          alt=""
          className="h-6 text-black mix-blend-difference w-6"
        />{" "}
       
      </header>

      <main className="mx-auto max-w-2xl px-4 pb-32 pt-28 font-mono tracking-tight md:pt-36">
        <h1 className="text-xl uppercase">Privacy policy</h1>
        <p className="mt-2 text-xs uppercase text-white/40">
          Effective {CONFIG.effectiveDate}
        </p>

        <nav className="mt-10 flex flex-wrap gap-x-4 gap-y-2 border-y border-white/10 py-4 text-xs uppercase text-white/50">
          {sections.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="hover:text-[#f8ff9a]">
              {s.title}
            </a>
          ))}
        </nav>

        <div className="mt-14 flex flex-col gap-14">
          {sections.map((s) => (
            <section key={s.id} id={s.id} className="scroll-mt-28">
              <h2 className="text-sm uppercase text-[#f8ff9a]">{s.title}</h2>
              <div className="mt-3 flex flex-col gap-3">
                {s.body.map((p, i) => (
                  <p key={i} className="text-sm leading-relaxed text-white/70">
                    {p}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
