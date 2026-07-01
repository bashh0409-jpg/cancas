"use client";

import Link from "next/link";

const documents = [
  { id: "terms", title: "Terms of Service" },
  { id: "privacy", title: "Privacy Policy (POPIA & GDPR)" },
  { id: "cookies", title: "Cookie Policy" },
  { id: "beta", title: "Beta Testing Terms" },
  { id: "acceptable-use", title: "Acceptable Use Policy" },
  { id: "community", title: "Community Guidelines" },
  { id: "ai-usage", title: "AI Usage Policy" },
  { id: "copyright", title: "Copyright & Intellectual Property Policy" },
  { id: "deletion", title: "Account Deletion & Data Retention Policy" },
];

export default function LegalPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between border-b border-white/10 px-6 py-4">
        <Link
          href="/"
          className="mono text-sm tracking-tight text-white/70 hover:text-white"
        >
          ← Back to Home
        </Link>
        <span className="mono text-xs uppercase tracking-tight text-white/30">
          Legal
        </span>
      </nav>

      <div className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-2xl mono uppercase tracking-tight">
          Legal Documents
        </h1>
        <p className="mt-2 text-sm mono text-white/50">
          All policies governing the use of Reflow. Links will be added here
          once published.
        </p>

        <div className="mt-10 flex flex-col gap-2">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="rounded border border-white/10 bg-white/[0.03] px-5 py-4"
            >
              <p className="text-sm mono tracking-tight text-white/70">
                {doc.title}
              </p>
              <p className="mt-1 text-[11px] mono text-white/30">
                Link pending — will be added once published to Notion.
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-white/10 pt-6">
          <p className="text-xs mono text-white/30 text-center">
            Reflow Inc · hello@reflow.app · Last updated: January 2026
          </p>
        </div>
      </div>
    </main>
  );
}