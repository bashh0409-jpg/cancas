//
//  page.tsx  (legal hub)
//
//
//  Created by Wandile Langa on 2026/08/16.
//

"use client";

import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";

const CONFIG = {
  productName: "Reflow",
  contactEmail: "legal@reflow.site",
};

const documents = [
  {
    href: "/privacy-policy",
    title: "Privacy policy",
    description:
      "What we collect, how sign-in and connected storage providers work, and how your data is used and stored.",
  },
  {
    href: "/terms-of-service",
    title: "Terms of service",
    description:
      "The rules for using Reflow — your account, your content, billing, and acceptable use.",
  },
  // Add more as they exist, e.g.:
  // {
  //   href: "/cookie-policy",
  //   title: "Cookie policy",
  //   description: "Which cookies and trackers we use and why.",
  // },
  // {
  //   href: "/dpa",
  //   title: "Data processing agreement",
  //   description: "For teams that need a DPA for compliance purposes.",
  // },
];

export default function LegalPage() {
  return (
    <div className="relative min-h-screen bg-[#101010] text-white">
      <header className="fixed z-30 flex w-full items-center justify-between p-4 font-mono text-sm font-medium uppercase">
        <Link
          href="/"
          className="flex items-center gap-2 text-white transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          
        </Link>
         <img
          src="/images/Re.svg"
          alt=""
          className="h-6 text-black mix-blend-difference w-6"
        />{" "}
       
      </header>

      <main className="mx-auto max-w-2xl px-4 pb-32 pt-28 font-mono tracking-tight md:pt-36">
        <h1 className="text-xl uppercase">Legal</h1>
        <p className="mt-2 text-xs uppercase text-white/40">
          Policies and agreements for {CONFIG.productName}
        </p>

        <div className="mt-10 flex flex-wrap gap-3">
          {documents.map((doc) => (
            <Link
              key={doc.href}
              href={doc.href}
              className="group flex w-full flex-col gap-2 rounded border border-white/10 p-4 transition-colors hover:border-white/25 hover:bg-white/[0.03] sm:w-[calc(50%-6px)]"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-sm uppercase">{doc.title}</h2>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-white/30 transition-colors group-hover:text-[#f8ff9a]" />
              </div>
              <p className="text-xs leading-relaxed text-white/50">
                {doc.description}
              </p>
            </Link>
          ))}
        </div>

        <p className="mt-14 text-sm leading-relaxed text-white/40">
          Questions about any of these documents? Reach us at{" "}
          <a
            href={`mailto:${CONFIG.contactEmail}`}
            className="text-white/70 underline underline-offset-4 hover:text-[#f8ff9a]"
          >
            {CONFIG.contactEmail}
          </a>
          .
        </p>
      </main>
    </div>
  );
}
