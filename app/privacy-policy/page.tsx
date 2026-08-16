//
//  page.tsx  (privacy policy)
//
//
//  Created by Wandile Langa on 2026/08/16.
//

"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

// ── Fill these in — Google's reviewers check these against your
// ── Cloud Console branding + actual product behavior. ────────────────
const CONFIG = {
  companyName: "Wandile Langa",
  productName: "Reflow",
  contactEmail: "privacy@swipes.site", // update to your real inbox
  domain: "swipes.site", // update if this lives elsewhere
  effectiveDate: "16 August 2026",
  jurisdiction:
    "South Africa, and we comply with the Protection of Personal Information Act (POPIA). If you're outside South Africa, we also apply GDPR-equivalent principles.",
};

const sections = [
  {
    id: "overview",
    title: "Overview",
    body: [
      `This policy explains what personal information ${CONFIG.productName} ("we", "us") collects, why we collect it, and how you can control it. It applies to ${CONFIG.domain} and any app or account connected to it.`,
      `We are based in ${CONFIG.jurisdiction}`,
    ],
  },
  {
    id: "google-data",
    title: "Google account data",
    body: [
      `When you sign in with Google, we request access to your basic profile (name, email address, and profile photo) so we can create and authenticate your ${CONFIG.productName} account.`,
      `If you choose to import or export files through Google Drive, we request the drive.file scope. This scope only gives us access to files you explicitly create with ${CONFIG.productName} or select yourself through Google's file picker — we cannot see, read, or modify anything else in your Drive.`,
      `We use this data only to identify you, secure your account, and to save or retrieve the specific files you choose to work with. We do not sell, rent, or share your Google account or Drive data with third parties for advertising or marketing purposes, and we don't use it to train AI models.`,
      `If this ever changes — for example, if we add a feature that needs a broader scope — we'll ask for your explicit consent at the time and update this policy first.`,
    ],
  },
  {
    id: "collect",
    title: "Information we collect",
    body: [
      "Account information: name, email address, and profile photo from Google sign-in, or the details you provide if you sign up another way.",
      "Drive files: only files you create with Reflow or explicitly pick through Google's file selector, if you use import/export.",
      "Usage data: how you interact with the canvas — pages visited, features used, and basic device/browser information — so we can fix bugs and improve the product.",
      "Content you create: assets, boards, and projects you generate or upload inside the product.",
    ],
  },
  {
    id: "use",
    title: "How we use it",
    body: [
      "To create and maintain your account, and authenticate you on future visits.",
      "To operate the core product — saving, organizing, and rendering your canvas and assets.",
      "To send you account-related emails (e.g. sign-in alerts, changes to this policy). We won't send marketing email without a separate opt-in.",
      "To monitor performance and diagnose issues.",
    ],
  },
  {
    id: "sharing",
    title: "Sharing and disclosure",
    body: [
      "We don't sell personal information. We share data only with the infrastructure providers that run the product (for example, hosting and authentication providers), under contracts that limit them to processing it on our behalf.",
      "We may disclose information if required by law, or to protect the rights, safety, or property of our users or the public.",
    ],
  },
  {
    id: "retention",
    title: "Data retention",
    body: [
      "We keep your account data for as long as your account is active. If you delete your account, we remove your personal information within 30 days, except where we're required to retain it for legal or security reasons.",
    ],
  },
  {
    id: "rights",
    title: "Your rights",
    body: [
      "You can access, correct, or delete your account information at any time from your account settings, or by contacting us directly.",
      "You can revoke Reflow's access to your Google account at any time from your Google Account permissions page (myaccount.google.com/permissions).",
      "You can ask us what data we hold about you, and request that we delete it, subject to legal retention requirements.",
    ],
  },
  {
    id: "cookies",
    title: "Cookies",
    body: [
      "We use essential cookies to keep you signed in and remember basic preferences. We don't use third-party advertising cookies.",
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
          className="flex items-center gap-2 text-white/70 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <span className="text-white/40">{CONFIG.productName}</span>
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
