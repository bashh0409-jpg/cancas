"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, ArrowRight, X } from "lucide-react";

const legalDocuments = [
  {
    title: "Terms of service",
    description:
      "Covers the rules for using the platform, account responsibilities, and service limitations.",
    preview: `# Reflow Terms of Service

Effective Date: July 1, 2026

## 1. Introduction
Welcome to Reflow. These Terms of Service ("Terms") govern your access to and use of the Reflow website, applications, and services. By creating an account or using Reflow, you agree to be bound by these Terms.

If you do not agree, you may not use the Services.

## 2. About Reflow
Reflow is an AI-powered workspace designed for creating, organizing, and collaborating on digital content including documents, notes, code, and media.

## 3. Eligibility
You must be at least 13 years old or the minimum legal age in your country to use Reflow.

## 4. Accounts
You are responsible for:
- Maintaining account security
- Providing accurate information
- All activity under your account

## 5. Beta Disclaimer
Reflow is in beta. Features may change or break without notice. Data loss may occur.

## 6. User Content
You retain ownership of your content. You grant Reflow a limited license to host and process it to provide the Services.

## 7. Acceptable Use
You may not:
- Break laws
- Abuse or harm others
- Upload malicious software
- Attempt unauthorized access

## 8. AI Features
AI output may be incorrect. You must review all outputs before relying on them.

## 9. Service Availability
We may modify, suspend, or discontinue services at any time.

## 10. Disclaimer
The service is provided "as is" without warranties.

## 11. Limitation of Liability
We are not liable for indirect damages, data loss, or service interruptions.`,
    href: "https://maize-vault-44c.notion.site/Swiped-Terms-of-Service-fce1fe0dccfc4fe0a05ad64f7363266e?source=copy_link",
  },

  {
    title: "Privacy policy",
    description:
      "Explains what personal data is collected, how it is used, and how it is protected.",
    preview: `# Reflow Privacy Policy

Effective Date: July 1, 2026

## 1. Introduction
We respect your privacy and are committed to protecting your personal information.

## 2. Information We Collect
We collect:
- Account information (name, email)
- Content you create
- Usage data
- Device and browser information
- Logs and diagnostics

## 3. How We Use Data
We use data to:
- Provide and improve the service
- Secure accounts
- Prevent abuse
- Comply with legal obligations

We do not sell personal data.

## 4. Sharing of Information
We share data only with:
- Service providers (hosting, analytics, AI processing)
- Legal authorities when required

## 5. Data Retention
Data is retained only as long as necessary to operate the service or comply with law.

## 6. Your Rights
You may request access, correction, deletion, or export of your data depending on your jurisdiction.

## 7. Security
We use industry-standard safeguards but cannot guarantee absolute security.`,
    href: "https://app.notion.com/p/Reflow-Privacy-Policy-5a5e723ba16e4f44af9c888898f7746e?source=copy_link",
  },

  {
    title: "Cookie policy",
    description:
      "Details the cookies and tracking tools used on the site and why they are used.",
    preview: `# Reflow Cookie Policy

Effective Date: July 1, 2026

## 1. What Are Cookies
Cookies are small files stored on your device that help improve user experience.

## 2. Types of Cookies
We use:
- Essential cookies (authentication, security)
- Functional cookies (preferences)
- Analytics cookies (usage tracking)
- Performance cookies (bug detection)

We do not use advertising cookies in beta.

## 3. Third Parties
Some providers (hosting, analytics, AI services) may set cookies.

## 4. Control
You may disable cookies in browser settings, but some features may stop working.`,
    href: "https://app.notion.com/p/Reflow-Cookie-Policy-390e79c73b25803093a5c64819f5698b?source=copy_link",
  },

  {
    title: "Beta agreement",
    description:
      "Sets expectations for early access users, feedback, and the temporary nature of beta testing.",
    preview: `# Reflow Beta Testing Agreement

Effective Date: July 1, 2026

## 1. Beta Status
Reflow is an experimental beta product. It may contain bugs, errors, or missing features.

## 2. Risks
Users acknowledge:
- Possible downtime
- Data loss
- Feature instability

## 3. Feedback Rights
Feedback may be used by Reflow without compensation.

## 4. Access Control
We may modify or revoke beta access at any time.

## 5. No Guarantees
No uptime, stability, or data retention guarantees are provided.`,
    href: "https://app.notion.com/p/Reflow-Beta-Testing-Agreement-390e79c73b2580ca9ee8fd76f8274d24?source=copy_link",
  },

  {
    title: "Acceptable use",
    description:
      "Defines prohibited conduct and the standards for responsible and lawful use of the platform.",
    preview: `# Reflow Acceptable Use Policy

    Effective Date: July 1, 2026

## 1. Prohibited Use
You may not use Reflow to:
- Violate laws
- Harm others
- Distribute malware
- Commit fraud or scams

## 2. Security Abuse
No hacking, reverse engineering, or unauthorized access.

## 3. Spam
No bots, scraping, or unsolicited messages.

## 4. Content Rules
No hateful, violent, or illegal content.

## 5. Enforcement
We may suspend or terminate accounts for violations.`,
    href: "https://app.notion.com/p/Reflow-Acceptable-Use-Policy-390e79c73b25804cae66dbb15c9dd216?source=copy_link",
  },

  {
    title: "AI usage policy",
    description:
      "Provides guidance on responsible AI use, safeguards, and expectations for generated output.",
    preview: `# Reflow AI Usage Policy

    Effective Date: July 1, 2026
    
## 1. Purpose
AI tools assist with writing, coding, and productivity.

## 2. Limitations
AI outputs may be incorrect, incomplete, or misleading.

## 3. Responsibility
Users are responsible for reviewing outputs before use.

## 4. Prohibited Use
AI may not be used for:
- Illegal activity
- Fraud or deception
- Harmful content
- Malware generation

## 5. Safety Controls
Reflow may filter or restrict AI usage for safety.`,
    href: "https://app.notion.com/p/Reflow-AI-Usage-Policy-390e79c73b2580668ae4daab0c271fc2?source=copy_link",
  },

  {
    title: "Copyright & Intellectual Property Policy",
    description:
      "Clarifies ownership of content, trademarks, and intellectual property on the platform.",
    preview: `# Reflow Intellectual Property Policy

    Effective Date: July 1, 2026

## 1. User Content
Users retain ownership of their content.

## 2. License
Users grant Reflow a limited license to host and process content.

## 3. Reflow IP
All platform code, design, branding, and features belong to Reflow.

## 4. Copyright Infringement
We respond to valid takedown notices and may remove infringing content.

## 5. Enforcement
Repeat infringers may have accounts terminated.`,
    href: "https://app.notion.com/p/Reflow-Copyright-Intellectual-Property-Policy-390e79c73b25806cbc96f3313f7e90b6?source=copy_link",
  },

  {
    title: "Account deletion",
    description:
      "Explains how accounts can be deleted, what happens to data, and how retention is handled.",
    preview: `# Reflow Account Deletion & Data Retention Policy

    Effective Date: July 1, 2026

## 1. Deletion Requests
Users may delete accounts at any time.

## 2. Data Removal
Most data is deleted or anonymized after deletion.

## 3. Retention
Some data may be retained for:
- Legal compliance
- Security
- System backups

## 4. Shared Data
Shared workspace content may remain visible to collaborators.

## 5. Irreversibility
Deleted accounts cannot be restored.

## 6. Backups
Residual backup data may persist temporarily before deletion.`,
    href: "https://app.notion.com/p/Reflow-Account-Deletion-Data-Retention-Policy-390e79c73b2580098822c96914ae2418?source=copy_link",
  },
];

export default function LegalPage() {
  const router = useRouter();
  const [activeDocument, setActiveDocument] = useState(legalDocuments[0]);

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  return (
    <main className="h-screen bg-white mono px-6 py-2 text-black sm:px-8 lg:px-12 overflow-hidden">
      <div className="mx-auto flex h-full max-w-6xl flex-col gap-4 mt-4">
        <div className="">
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center absolute right-4  gap-2 rounded border border-black/10 bg-black/[0.03] px-2 cursor-pointer py-1 text-[10px] uppercase tracking-tight text-black/70 transition hover:bg-black/[0.06]"
          >
            <X className="h-4 w-4" />
           
          </button>

          <p className="text-md p-4 uppercase tracking-tight text-black/50">
            Legal documents
          </p>
          <p></p>
        </div>

        {/* MAIN SPLIT AREA */}
        <div className="flex flex-1 gap-2 lg:flex-row overflow-hidden">
          {/* LEFT SIDE (SCROLLABLE) */}
          <div className="w-full lg:w-[40%] h-full scrollbar-hidden overflow-y-auto pr-2">
            <div className="grid gap-4">
              {legalDocuments.map((document) => (
                <button
                  key={document.title}
                  type="button"
                  onClick={() => setActiveDocument(document)}
                  className="group flex items-center justify-between rounded p-4 text-left transition hover:bg-black/[0.06]"
                >
                  <div>
                    <p className="text-sm uppercase tracking-tight text-black">
                      {document.title}
                    </p>
                    <p className="mt-2 text-[10px] uppercase tracking-tight text-black/65">
                      {document.description}
                    </p>
                  </div>

                  <ArrowRight className="h-5 w-5 shrink-0 text-black/50 transition group-hover:text-black" />
                </button>
              ))}
            </div>
          </div>

          {/* RIGHT SIDE (SCROLLABLE) */}
          <div className="w-full lg:w-[60%] rounded h-full scrollbar-hidden overflow-y-auto ">
            <div className="rounded bg-black/[0.03] p-4">
              <h2 className="text-sm uppercase tracking-tight text-black">
                {activeDocument.title}
              </h2>

              <p className="mt-3 text-[11px] uppercase tracking-tight leading-5 text-black/70">
                {activeDocument.description}
              </p>

              <div className="mt-4 space-y-2 text-[11px] uppercase tracking-tight leading-5 text-black/70">
                {activeDocument.preview.split("\n").map((line, index) => {
                  const trimmed = line.trim();

                  if (!trimmed) {
                    return <div key={index} className="h-2" />;
                  }

                  if (trimmed.startsWith("#")) {
                    const level = trimmed.match(/^#+/)?.[0].length ?? 1;
                    const text = trimmed.replace(/^#+\s*/, "");

                    return (
                      <p
                        key={index}
                        className={
                          level === 1
                            ? "mt-3 font-medium"
                            : "mt-3 font-medium text-black/80"
                        }
                      >
                        {text}
                      </p>
                    );
                  }

                  return (
                    <p key={index} className="leading-5">
                      {trimmed}
                    </p>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="rounded bg-black/[0.03] p-2 mb-4 text-[10px]  uppercase tracking-tight text-black/70">
          <p>
            If you need a copy of one of these documents or have a legal
            question, please reach out to our support team.
          </p>
        </div>
      </div>
    </main>
  );
}
