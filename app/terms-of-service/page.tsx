//
//  page.tsx  (terms of service)
//
//
//  Created by Wandile Langa on 2026/08/16.
//

"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

// ── Same CONFIG as the privacy policy — keep these in sync. ──────────
const CONFIG = {
  companyName: "[Legal entity / your name, e.g. Wandile Langa]",
  productName: "Reflow",
  contactEmail: "legal@swipes.site", // update to your real inbox
  domain: "swipes.site",
  effectiveDate: "16 August 2026",
  jurisdiction: "South Africa",
};

const sections = [
  {
    id: "acceptance",
    title: "Acceptance of terms",
    body: [
      `By creating an account or using ${CONFIG.productName}, you agree to these Terms of Service and our Privacy Policy. If you don't agree, don't use the product.`,
      `You must be at least 13 years old (or the minimum age of digital consent in your country) to use ${CONFIG.productName}.`,
    ],
  },
  {
    id: "service",
    title: "The service",
    body: [
      `${CONFIG.productName} is a visual, AI-assisted workspace for generating, organizing, and refining creative assets. We may add, change, or remove features at any time, and we'll try to give you notice before changes that materially reduce functionality you rely on.`,
      "We may offer free and paid tiers. Where paid features exist, pricing and billing terms will be shown before you're charged.",
    ],
  },
  {
    id: "account",
    title: "Your account",
    body: [
      "You're responsible for keeping your login credentials secure and for all activity under your account.",
      `If you sign in with Google, you authorize ${CONFIG.productName} to verify your identity via your Google profile, and — if you use import/export — to access only the specific Drive files you create with ${CONFIG.productName} or select through Google's file picker (the drive.file scope). We never get blanket access to your Drive.`,
      "Tell us immediately if you suspect unauthorized access to your account.",
    ],
  },
  {
    id: "content",
    title: "Your content",
    body: [
      `You keep ownership of the content you create, upload, or generate in ${CONFIG.productName} ("Your Content"). By using the service, you grant us a limited license to host, store, and display Your Content solely to operate and improve the product for you.`,
      "You're responsible for Your Content and for having the rights to anything you upload as a reference or input.",
      "We don't claim ownership of Your Content, and we don't use it to train third-party AI models without your separate, explicit consent.",
    ],
  },
  {
    id: "ai-output",
    title: "AI-generated output",
    body: [
      `${CONFIG.productName} uses AI models to generate images, video, and variations based on your prompts and references. Generated output may not be unique — similar prompts from other users can produce similar results, and we can't guarantee any output is free of third-party rights.`,
      "You're responsible for reviewing generated output before using it commercially, including checking it doesn't infringe someone else's intellectual property.",
    ],
  },
  {
    id: "acceptable-use",
    title: "Acceptable use",
    body: [
      "Don't use the service to generate or distribute illegal content, infringe others' intellectual property, harass or impersonate people, or attempt to access accounts or data that aren't yours.",
      "Don't reverse-engineer, scrape, or attempt to circumvent rate limits or security controls on the service.",
      "We can suspend or terminate accounts that violate these terms.",
    ],
  },
  {
    id: "termination",
    title: "Termination",
    body: [
      "You can delete your account at any time from your account settings. We'll remove your personal data per our Privacy Policy.",
      "We may suspend or terminate your access if you violate these terms, or if we discontinue the service, with reasonable notice where possible.",
    ],
  },
  {
    id: "disclaimers",
    title: "Disclaimers",
    body: [
      `${CONFIG.productName} is provided "as is," without warranties of any kind. We don't guarantee the service will be uninterrupted, error-free, or that generated output will meet your expectations.`,
    ],
  },
  {
    id: "liability",
    title: "Limitation of liability",
    body: [
      `To the extent permitted by law, ${CONFIG.companyName} is not liable for indirect, incidental, or consequential damages arising from your use of ${CONFIG.productName}. Our total liability for any claim is limited to the amount you paid us in the 12 months before the claim arose.`,
    ],
  },
  {
    id: "law",
    title: "Governing law",
    body: [
      `These terms are governed by the laws of ${CONFIG.jurisdiction}. Any disputes will be handled in the courts of that jurisdiction, unless local law requires otherwise.`,
    ],
  },
  {
    id: "changes",
    title: "Changes to these terms",
    body: [
      "If we make material changes, we'll update the effective date below and notify you by email or in-product before the change takes effect. Continued use after that point means you accept the updated terms.",
    ],
  },
  {
    id: "contact",
    title: "Contact",
    body: [`Questions about these terms: ${CONFIG.contactEmail}.`],
  },
];

export default function TermsOfServicePage() {
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
        <h1 className="text-xl uppercase">Terms of service</h1>
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

        <p className="mt-16  border-t border-white/10 pt-6 text-xs leading-relaxed text-white/30">
          These terms are a starting point, not legal advice — have a lawyer
          review them before relying on this for a live product, especially the
          liability and governing-law sections.
        </p>
      </main>
    </div>
  );
}
