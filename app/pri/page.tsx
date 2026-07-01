import Link from "next/link";
import {
  ArrowLeftIcon,
  CalculatorIcon,
  CircleDollarSignIcon,
  DatabaseIcon,
  FileTextIcon,
  ImageIcon,
  MicIcon,
  SparklesIcon,
  VideoIcon,
} from "lucide-react";

type BillingUnit =
  | "1M input tokens"
  | "1M output tokens"
  | "image"
  | "second"
  | "GPU second"
  | "grounded prompt";

type ProviderCost = {
  provider: string;
  model: string;
  useCase: string;
  unit: BillingUnit;
  providerCostUsd: number;
  source: string;
  note?: string;
};

type UsageEstimate = {
  action: string;
  providerModel: string;
  assumption: string;
  providerCostUsd: number;
};

const CREDIT_USD = 0.01;
const MARKUP = 1.3;
const UPDATED_AT = "July 1, 2026";

const providerCosts: ProviderCost[] = [
  {
    provider: "Anthropic",
    model: "Claude Sonnet 5",
    useCase: "Primary app reasoning, document Q&A, code actions",
    unit: "1M input tokens",
    providerCostUsd: 2,
    source: "https://platform.claude.com/docs/en/about-claude/pricing",
    note: "Intro pricing through Aug 31, 2026",
  },
  {
    provider: "Anthropic",
    model: "Claude Sonnet 5",
    useCase: "Primary app reasoning, document Q&A, code actions",
    unit: "1M output tokens",
    providerCostUsd: 10,
    source: "https://platform.claude.com/docs/en/about-claude/pricing",
    note: "Intro pricing through Aug 31, 2026",
  },
  {
    provider: "Anthropic",
    model: "Claude Sonnet 5",
    useCase: "Fallback standard rate from Sep 1, 2026",
    unit: "1M input tokens",
    providerCostUsd: 3,
    source: "https://platform.claude.com/docs/en/about-claude/pricing",
  },
  {
    provider: "Anthropic",
    model: "Claude Sonnet 5",
    useCase: "Fallback standard rate from Sep 1, 2026",
    unit: "1M output tokens",
    providerCostUsd: 15,
    source: "https://platform.claude.com/docs/en/about-claude/pricing",
  },
  {
    provider: "Anthropic",
    model: "Claude Haiku 4.5",
    useCase: "Cheap classification, file routing, short summaries",
    unit: "1M input tokens",
    providerCostUsd: 1,
    source: "https://platform.claude.com/docs/en/about-claude/pricing",
  },
  {
    provider: "Anthropic",
    model: "Claude Haiku 4.5",
    useCase: "Cheap classification, file routing, short summaries",
    unit: "1M output tokens",
    providerCostUsd: 5,
    source: "https://platform.claude.com/docs/en/about-claude/pricing",
  },
  {
    provider: "Anthropic",
    model: "Claude Opus 4.8",
    useCase: "Premium reasoning for expensive user-selected jobs",
    unit: "1M input tokens",
    providerCostUsd: 5,
    source: "https://platform.claude.com/docs/en/about-claude/pricing",
  },
  {
    provider: "Anthropic",
    model: "Claude Opus 4.8",
    useCase: "Premium reasoning for expensive user-selected jobs",
    unit: "1M output tokens",
    providerCostUsd: 25,
    source: "https://platform.claude.com/docs/en/about-claude/pricing",
  },
  {
    provider: "OpenAI",
    model: "gpt-5.5",
    useCase: "Alternative flagship text model",
    unit: "1M input tokens",
    providerCostUsd: 5,
    source: "https://developers.openai.com/api/docs/pricing",
  },
  {
    provider: "OpenAI",
    model: "gpt-5.5",
    useCase: "Alternative flagship text model",
    unit: "1M output tokens",
    providerCostUsd: 30,
    source: "https://developers.openai.com/api/docs/pricing",
  },
  {
    provider: "OpenAI",
    model: "gpt-5.4-mini",
    useCase: "Fast low-cost chat, routing, title generation",
    unit: "1M input tokens",
    providerCostUsd: 0.75,
    source: "https://developers.openai.com/api/docs/pricing",
  },
  {
    provider: "OpenAI",
    model: "gpt-5.4-mini",
    useCase: "Fast low-cost chat, routing, title generation",
    unit: "1M output tokens",
    providerCostUsd: 4.5,
    source: "https://developers.openai.com/api/docs/pricing",
  },
  {
    provider: "OpenAI",
    model: "gpt-image-2",
    useCase: "Image edits and generation",
    unit: "1M input tokens",
    providerCostUsd: 8,
    source: "https://developers.openai.com/api/docs/pricing",
    note: "Image input tokens",
  },
  {
    provider: "OpenAI",
    model: "gpt-image-2",
    useCase: "Image edits and generation",
    unit: "1M output tokens",
    providerCostUsd: 30,
    source: "https://developers.openai.com/api/docs/pricing",
    note: "Image output tokens",
  },
  {
    provider: "OpenAI",
    model: "sora-2",
    useCase: "Video generation",
    unit: "second",
    providerCostUsd: 0.1,
    source: "https://developers.openai.com/api/docs/pricing",
  },
  {
    provider: "Google",
    model: "Gemini 2.5 Pro",
    useCase: "Large-context document and spreadsheet analysis",
    unit: "1M input tokens",
    providerCostUsd: 0.625,
    source: "https://ai.google.dev/gemini-api/docs/pricing",
    note: "Prompts <= 200k tokens",
  },
  {
    provider: "Google",
    model: "Gemini 2.5 Pro",
    useCase: "Large-context document and spreadsheet analysis",
    unit: "1M output tokens",
    providerCostUsd: 5,
    source: "https://ai.google.dev/gemini-api/docs/pricing",
    note: "Prompts <= 200k tokens",
  },
  {
    provider: "Google",
    model: "Gemini 2.5 Flash",
    useCase: "Fast multimodal analysis",
    unit: "1M input tokens",
    providerCostUsd: 0.3,
    source: "https://ai.google.dev/gemini-api/docs/pricing",
  },
  {
    provider: "Google",
    model: "Gemini 2.5 Flash",
    useCase: "Fast multimodal analysis",
    unit: "1M output tokens",
    providerCostUsd: 2.5,
    source: "https://ai.google.dev/gemini-api/docs/pricing",
  },
  {
    provider: "Google",
    model: "Gemini 2.5 Flash Image",
    useCase: "Image generation",
    unit: "image",
    providerCostUsd: 0.039,
    source: "https://ai.google.dev/gemini-api/docs/pricing",
    note: "Up to 1024x1024 image output",
  },
  {
    provider: "Google",
    model: "Google Search grounding",
    useCase: "Web-grounded prompts after free allowance",
    unit: "grounded prompt",
    providerCostUsd: 0.035,
    source: "https://ai.google.dev/gemini-api/docs/pricing",
  },
  {
    provider: "Replicate",
    model: "Nvidia T4",
    useCase: "Low-cost custom image/video model runtime",
    unit: "GPU second",
    providerCostUsd: 0.000225,
    source: "https://replicate.com/pricing",
  },
  {
    provider: "Replicate",
    model: "Nvidia L40S",
    useCase: "Fast image generation and editing runtime",
    unit: "GPU second",
    providerCostUsd: 0.000975,
    source: "https://replicate.com/pricing",
  },
  {
    provider: "Replicate",
    model: "Nvidia H100",
    useCase: "Premium custom model runtime",
    unit: "GPU second",
    providerCostUsd: 0.001525,
    source: "https://replicate.com/pricing",
  },
];

const usageEstimates: UsageEstimate[] = [
  {
    action: "Ask AI on a document",
    providerModel: "Claude Sonnet 5",
    assumption: "4k input tokens + 1k output tokens",
    providerCostUsd: costFromTokens(2, 10, 4000, 1000),
  },
  {
    action: "Summarize a medium PDF",
    providerModel: "Claude Haiku 4.5",
    assumption: "12k input tokens + 900 output tokens",
    providerCostUsd: costFromTokens(1, 5, 12000, 900),
  },
  {
    action: "Analyze spreadsheet",
    providerModel: "Gemini 2.5 Pro",
    assumption: "30k input tokens + 2k output tokens",
    providerCostUsd: costFromTokens(0.625, 5, 30000, 2000),
  },
  {
    action: "Describe image",
    providerModel: "Gemini 2.5 Flash",
    assumption: "2k multimodal input tokens + 700 output tokens",
    providerCostUsd: costFromTokens(0.3, 2.5, 2000, 700),
  },
  {
    action: "Generate image",
    providerModel: "Gemini 2.5 Flash Image",
    assumption: "One 1024px image output",
    providerCostUsd: 0.039,
  },
  {
    action: "Generate 10s video",
    providerModel: "OpenAI sora-2",
    assumption: "10 seconds at 720p",
    providerCostUsd: 1,
  },
];

const sources = [
  {
    name: "Anthropic Claude pricing",
    href: "https://platform.claude.com/docs/en/about-claude/pricing",
  },
  {
    name: "OpenAI API pricing",
    href: "https://developers.openai.com/api/docs/pricing",
  },
  {
    name: "Google Gemini API pricing",
    href: "https://ai.google.dev/gemini-api/docs/pricing",
  },
  {
    name: "Replicate hardware pricing",
    href: "https://replicate.com/pricing",
  },
];

export default function CreditPricingPage() {
  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-8 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-8 rounded-lg border border-white/10 bg-white/[0.03] p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Home
            </Link>
            <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">
              Updated {UPDATED_AT}
            </span>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <p className="mb-3 text-sm text-white/45">CanvasAI billing draft</p>
              <h1 className="max-w-3xl text-4xl leading-tight tracking-tight text-white sm:text-6xl">
                Credit spending table with a built-in profit margin.
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-6 text-white/55 sm:text-base">
                This page converts provider API prices into CanvasAI credits.
                The default rule is simple: pass through the provider cost, add
                a 30% markup, then round up to whole credits before the request
                runs.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <MetricCard label="Credit value" value="$0.01" detail="1 credit" />
              <MetricCard
                label="Markup"
                value="30%"
                detail="Provider cost x 1.3"
              />
              <MetricCard
                label="Profit rule"
                value="$1 -> $1.30"
                detail="100 provider cents bills 130 credits"
              />
            </div>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-4">
          <RuleCard
            icon={<CalculatorIcon className="h-5 w-5" />}
            title="Charge formula"
            body="credits = ceil(provider_cost_usd x 1.3 / 0.01)"
          />
          <RuleCard
            icon={<CircleDollarSignIcon className="h-5 w-5" />}
            title="Margin guard"
            body="Every paid API call keeps roughly 23% gross margin after provider cost."
          />
          <RuleCard
            icon={<DatabaseIcon className="h-5 w-5" />}
            title="Ledger rule"
            body="Estimate before the call, reserve credits, then reconcile with actual usage."
          />
          <RuleCard
            icon={<SparklesIcon className="h-5 w-5" />}
            title="Model routing"
            body="Use cheap models for routing and summaries, premium models only when selected."
          />
        </section>

        <section className="rounded-lg border border-white/10 bg-white/[0.03]">
          <div className="flex flex-col gap-2 border-b border-white/10 p-5 sm:p-6">
            <h2 className="text-2xl tracking-tight">Provider Cost To Credits</h2>
            <p className="text-sm text-white/50">
              Provider prices are listed in USD. CanvasAI charge and credits
              include the 30% markup.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse text-left text-sm">
              <thead className="bg-white/[0.04] text-xs uppercase text-white/40">
                <tr>
                  <Th>Provider</Th>
                  <Th>Model</Th>
                  <Th>Use case</Th>
                  <Th>Unit</Th>
                  <Th>Provider cost</Th>
                  <Th>Charge user</Th>
                  <Th>Credits</Th>
                  <Th>Profit</Th>
                  <Th>Note</Th>
                </tr>
              </thead>
              <tbody>
                {providerCosts.map((cost) => {
                  const charge = chargeUsd(cost.providerCostUsd);
                  const credits = creditsForUsd(cost.providerCostUsd);
                  const profit = charge - cost.providerCostUsd;

                  return (
                    <tr
                      key={`${cost.provider}-${cost.model}-${cost.unit}-${cost.providerCostUsd}`}
                      className="border-t border-white/10 text-white/70"
                    >
                      <Td className="font-medium text-white">{cost.provider}</Td>
                      <Td>{cost.model}</Td>
                      <Td>{cost.useCase}</Td>
                      <Td>{cost.unit}</Td>
                      <Td>{formatUsd(cost.providerCostUsd)}</Td>
                      <Td className="text-emerald-200">{formatUsd(charge)}</Td>
                      <Td>{credits.toLocaleString()}</Td>
                      <Td className="text-emerald-200">{formatUsd(profit)}</Td>
                      <Td>
                        <div className="flex max-w-56 flex-col gap-1">
                          <span>{cost.note ?? "Standard public rate"}</span>
                          <a
                            href={cost.source}
                            className="text-white/40 underline-offset-4 hover:text-white hover:underline"
                          >
                            Source
                          </a>
                        </div>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-5 sm:p-6">
            <h2 className="text-2xl tracking-tight">Recommended App Charges</h2>
            <p className="mt-2 text-sm leading-6 text-white/50">
              These are starting estimates for CanvasAI actions. In production,
              reserve the estimated credits before the request and adjust down
              or up when the provider returns actual token usage.
            </p>

            <div className="mt-6 grid gap-3">
              <ActionChip
                icon={<FileTextIcon className="h-4 w-4" />}
                label="Documents"
                value="Claude Sonnet or Haiku"
              />
              <ActionChip
                icon={<ImageIcon className="h-4 w-4" />}
                label="Images"
                value="Gemini Flash Image or OpenAI image"
              />
              <ActionChip
                icon={<VideoIcon className="h-4 w-4" />}
                label="Video"
                value="Per-second pricing"
              />
              <ActionChip
                icon={<MicIcon className="h-4 w-4" />}
                label="Voice"
                value="Per-token or per-minute pricing"
              />
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/[0.03]">
            <div className="border-b border-white/10 p-5 sm:p-6">
              <h2 className="text-2xl tracking-tight">Action Examples</h2>
              <p className="mt-2 text-sm text-white/50">
                Example call estimates using the same 30% markup.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] border-collapse text-left text-sm">
                <thead className="bg-white/[0.04] text-xs uppercase text-white/40">
                  <tr>
                    <Th>Action</Th>
                    <Th>Provider model</Th>
                    <Th>Assumption</Th>
                    <Th>Provider cost</Th>
                    <Th>Credits charged</Th>
                    <Th>Profit</Th>
                  </tr>
                </thead>
                <tbody>
                  {usageEstimates.map((estimate) => {
                    const charge = chargeUsd(estimate.providerCostUsd);
                    const profit = charge - estimate.providerCostUsd;

                    return (
                      <tr
                        key={estimate.action}
                        className="border-t border-white/10 text-white/70"
                      >
                        <Td className="font-medium text-white">
                          {estimate.action}
                        </Td>
                        <Td>{estimate.providerModel}</Td>
                        <Td>{estimate.assumption}</Td>
                        <Td>{formatUsd(estimate.providerCostUsd)}</Td>
                        <Td className="text-emerald-200">
                          {creditsForUsd(estimate.providerCostUsd)}
                        </Td>
                        <Td>{formatUsd(profit)}</Td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-white/10 bg-white/[0.03] p-5 sm:p-6">
          <h2 className="text-2xl tracking-tight">Implementation Notes</h2>
          <div className="mt-5 grid gap-4 text-sm leading-6 text-white/55 md:grid-cols-3">
            <p>
              Store all credit events in a ledger: estimate, reserve, settle,
              refund, and failed-call reversal. That makes billing auditable.
            </p>
            <p>
              Keep a minimum charge of 1 credit for tiny calls so routing,
              metadata extraction, and retries never become invisible costs.
            </p>
            <p>
              For volatile providers, keep this table in a database or config
              file and refresh prices monthly before changing public plans.
            </p>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {sources.map((source) => (
              <a
                key={source.href}
                href={source.href}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/55 transition hover:bg-white/10 hover:text-white"
              >
                {source.name}
              </a>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function MetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/30 p-4">
      <p className="text-xs uppercase text-white/35">{label}</p>
      <p className="mt-2 text-2xl tracking-tight text-white">{value}</p>
      <p className="mt-1 text-xs text-white/45">{detail}</p>
    </div>
  );
}

function RuleCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-5">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-white/10 text-white">
        {icon}
      </div>
      <h2 className="text-base text-white">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-white/50">{body}</p>
    </div>
  );
}

function ActionChip({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-md border border-white/10 bg-black/20 px-4 py-3">
      <div className="flex items-center gap-3 text-white">
        <span className="text-white/70">{icon}</span>
        <span className="text-sm">{label}</span>
      </div>
      <span className="text-right text-xs text-white/45">{value}</span>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 font-medium">{children}</th>;
}

function Td({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={`px-4 py-4 align-top ${className}`}>{children}</td>;
}

function chargeUsd(providerCostUsd: number): number {
  return providerCostUsd * MARKUP;
}

function creditsForUsd(providerCostUsd: number): number {
  return Math.max(1, Math.ceil(chargeUsd(providerCostUsd) / CREDIT_USD));
}

function costFromTokens(
  inputPerMillionUsd: number,
  outputPerMillionUsd: number,
  inputTokens: number,
  outputTokens: number,
): number {
  return (
    (inputPerMillionUsd * inputTokens) / 1_000_000 +
    (outputPerMillionUsd * outputTokens) / 1_000_000
  );
}

function formatUsd(amount: number): string {
  if (amount < 0.01) {
    return `$${amount.toFixed(6)}`;
  }

  if (amount < 1) {
    return `$${amount.toFixed(4)}`;
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
