"use client";

import { useState } from "react";
import Link from "next/link";

const documents = [
  {
    id: "terms",
    title: "1. Terms of Service",
    content: `Reflow ("the App") provides an AI-powered infinite canvas workspace where users can create, edit, and manage digital content. By using the App, you agree to these Terms.

User Responsibilities
• You must be at least 13 years of age to use the App.
• You are responsible for maintaining the confidentiality of your account credentials.
• You agree not to misuse the App, including attempting to disrupt service, access unauthorized areas, or upload malicious content.

Limitation of Liability
Reflow is provided "as is" without warranties of any kind. To the maximum extent permitted by law, Reflow Inc shall not be liable for any indirect, incidental, or consequential damages arising from your use of the App.

Account Suspension & Termination
We reserve the right to suspend or terminate accounts that violate these Terms, engage in illegal activity, or disrupt the experience of other users. You may delete your account at any time via the Settings page.`,
  },
  {
    id: "privacy",
    title: "2. Privacy Policy (POPIA & GDPR)",
    content: `This Privacy Policy explains how Reflow Inc collects, uses, and protects your personal information in compliance with the Protection of Personal Information Act (POPIA) and the General Data Protection Regulation (GDPR).

What We Collect
• Account information: name, email address, and profile photo (if provided via Google or Microsoft OAuth).
• Content you create: canvas data, uploaded files, AI chat messages, and transcriptions.
• Usage data: page views, feature interactions, and error logs (via PostHog and Vercel Analytics).

Why We Collect It
• To provide and improve the App's functionality.
• To process AI requests through the Anthropic Claude API.
• To analyze usage patterns and fix bugs.
• To communicate with you about account-related matters.

Data Retention
We retain your data for as long as your account is active. Upon account deletion, your data is permanently removed within 30 days. Backups may persist for up to 90 days.

Third Parties
• Supabase – authentication and database hosting
• Anthropic – AI processing (Claude API)
• PostHog – product analytics
• Vercel – hosting and speed insights
• Stripe / PayFast – payment processing (if applicable)

Your Rights
Under POPIA and GDPR, you have the right to access, correct, delete, and port your data. You may exercise these rights via the Settings page or by contacting us at hello@reflow.app.

Data Transfers
Your data is processed in South Africa and may be transferred to servers in the United States and Europe for AI processing and hosting. Appropriate safeguards are in place.`,
  },
  {
    id: "cookies",
    title: "3. Cookie Policy",
    content: `Reflow uses cookies and local storage to enhance your experience.

Essential Cookies
• Session tokens (via Supabase auth) – required for you to stay logged in.
• Local storage preferences – remembers your settings and cookie consent choice.

Analytics Cookies
• PostHog – tracks feature usage and errors to help us improve the App.
• Vercel Analytics – aggregate page view statistics.

Managing Cookies
You can accept, reject, or customize your cookie preferences using the cookie banner that appears on your first visit. Your choice is stored in local storage and expires after 30 days.

No personal data is sold to third parties.`,
  },
  {
    id: "beta",
    title: "4. Beta Testing Terms",
    content: `Reflow is currently in beta. By using the App during this phase, you acknowledge:

• The App may contain bugs, errors, or incomplete features.
• Data loss or service interruptions may occur.
• Features may change, be removed, or be added without notice.
• You are encouraged to report issues via the feedback form or bug report links in the App.

Your use of the beta is at your own risk. We appreciate your help in making Reflow better.`,
  },
  {
    id: "acceptable-use",
    title: "5. Acceptable Use Policy",
    content: `You agree not to use Reflow for any of the following:

• Spam, phishing, or unsolicited messaging.
• Harassment, bullying, or hate speech.
• Uploading or generating illegal, violent, or sexually explicit content.
• Impersonating another person or entity.
• Attempting to bypass security measures or access other users' data.
• Using the App to violate any applicable laws or regulations.

Violation of this policy may result in immediate account suspension.`,
  },
  {
    id: "community",
    title: "6. Community Guidelines",
    content: `Reflow is a space for creativity and collaboration. We ask all users to:

• Be respectful and constructive in their interactions.
• Respect the intellectual property of others.
• Report inappropriate content or behavior.
• Use the App in a way that does not disrupt the experience of others.

We reserve the right to remove content or users that violate these guidelines.`,
  },
  {
    id: "ai-usage",
    title: "7. AI Usage Policy",
    content: `Reflow integrates AI features powered by Anthropic's Claude API.

How AI Works
• When you use "Ask AI", "Summarize", or "Edit with AI", the content of the selected file and your conversation history are sent to Anthropic for processing.
• AI-generated content is non-deterministic — results may vary and should be reviewed before use.

Data Handling
• File content sent to AI is used only to generate the response and is not stored by Anthropic for training purposes.
• You are responsible for ensuring that content you submit to AI features does not violate these Terms or any applicable laws.

Limitations
• AI features may produce inaccurate or inappropriate outputs. You should verify important information.
• AI features are subject to rate limits (20 requests per minute per IP).`,
  },
  {
    id: "copyright",
    title: "8. Copyright & Intellectual Property Policy",
    content: `Ownership
• All code, design, branding, and content of the Reflow App are the intellectual property of Reflow Inc unless otherwise stated.
• You retain full ownership of the content you create using the App.

User Content
• By uploading content to Reflow, you grant us a limited license to store, process, and display that content solely for the purpose of providing the App's functionality.
• You represent that you own or have the necessary rights to any content you upload.

Reporting Infringement
If you believe your copyright has been infringed, please contact us at hello@reflow.app with the following information:
• A description of the copyrighted work.
• The location of the infringing material in the App.
• Your contact information.

We will respond to valid takedown requests promptly.`,
  },
  {
    id: "deletion",
    title: "9. Account Deletion & Data Retention Policy",
    content: `Deleting Your Account
You can delete your account at any time from the Settings page. A verification code will be sent to your email to confirm the deletion.

What Happens
• Your account, canvases, files, and all associated data are permanently deleted.
• Deletion is irreversible — please back up any important data before proceeding.

Data Retention
• Active accounts: data is retained for as long as your account is active.
• Deleted accounts: data is purged immediately upon deletion.
• Backups: may persist for up to 90 days after deletion.
• Trash: deleted canvases are kept in the trash for 30 days before permanent deletion.

Contact
For questions about data deletion or retention, contact us at hello@reflow.app.`,
  },
];

export default function LegalPage() {
  const [openId, setOpenId] = useState<string | null>(null);

  const toggle = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between border-b border-white/10 px-6 py-4">
        <Link href="/" className="mono text-sm tracking-tight text-white/70 hover:text-white">
          ← Back to Home
        </Link>
        <span className="mono text-xs uppercase tracking-tight text-white/30">
          Legal
        </span>
      </nav>

      <div className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-2xl mono uppercase tracking-tight">Legal Documents</h1>
        <p className="mt-2 text-sm mono text-white/50">
          All policies governing the use of Reflow.
        </p>

        <div className="mt-10 flex flex-col gap-3">
          {documents.map((doc) => {
            const isOpen = openId === doc.id;

            return (
              <div
                key={doc.id}
                className="rounded border border-white/10 bg-white/[0.03] overflow-hidden"
              >
                <button
                  onClick={() => toggle(doc.id)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-white/5"
                >
                  <span className="text-sm mono tracking-tight">{doc.title}</span>
                  <svg
                    className={`h-4 w-4 shrink-0 text-white/40 transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {isOpen && (
                  <div className="border-t border-white/10 px-5 py-4">
                    <div className="prose prose-invert prose-sm max-w-none">
                      {doc.content.split("\n\n").map((paragraph, i) => {
                        const lines = paragraph.split("\n");
                        const isList = lines.length > 1 && lines[0].startsWith("•");

                        if (isList) {
                          return (
                            <ul key={i} className="mb-3 list-disc pl-5 text-xs mono text-white/70 leading-relaxed">
                              {lines.map((line, j) => (
                                <li key={j} className="mb-1">
                                  {line.replace(/^•\s*/, "")}
                                </li>
                              ))}
                            </ul>
                          );
                        }

                        const isHeading = lines.length === 1 && lines[0].endsWith(":");
                        if (isHeading) {
                          return (
                            <h3 key={i} className="mb-2 mt-4 text-xs mono font-medium uppercase tracking-tight text-white/80">
                              {lines[0]}
                            </h3>
                          );
                        }

                        return (
                          <p key={i} className="mb-3 text-xs mono text-white/70 leading-relaxed">
                            {paragraph}
                          </p>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
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