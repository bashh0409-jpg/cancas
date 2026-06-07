// ProcessSteps.tsx
import { FC, ReactNode } from "react";

interface Step {
  number: string;
  heading: string;
  body: string;
  visual: ReactNode;
}

interface ProcessStepsProps {
  steps?: Step[];
}

const ProcessSteps: FC<ProcessStepsProps> = ({ steps = DEFAULT_STEPS }) => {
  return (
    <section className="grid w-full" style={{ gridTemplateColumns: "58% 42%" }}>
      {/* Left column */}
      <div className="flex flex-col border-r border-white/[0.06]">
        {steps.map((step, i) => (
          <div
            key={step.number}
            className={`flex flex-1 flex-col px-14 py-12 ${
              i < steps.length - 1 ? "border-b border-white/[0.06]" : ""
            }`}
          >
            {/* STEP ——[01] */}
            <div className="mb-8 flex items-center gap-1">
              <span className="font-[Syne] text-[10.5px] uppercase tracking-[0.14em] text-neutral-600">
                Step
              </span>
              <span className="mx-1 text-neutral-700">——</span>
              <span className="border border-neutral-800 px-1.5 py-px font-[Syne] text-[10.5px] tracking-wider text-neutral-600">
                {step.number}
              </span>
            </div>

            <h2 className="mb-4 font-[Syne] text-[24px] font-medium leading-tight tracking-tight text-[#deded8]">
              {step.heading}
            </h2>

            <p className="max-w-[360px] text-[13.5px] font-light leading-[1.8] text-neutral-500">
              {step.body}
            </p>
          </div>
        ))}
      </div>

      {/* Right column — images aligned to each step row */}
      <div className="flex flex-col">
        {steps.map((step, i) => (
          <div
            key={step.number}
            className={`relative flex-1 overflow-hidden ${
              i < steps.length - 1 ? "border-b border-white/[0.05]" : ""
            }`}
          >
            {step.visual}
          </div>
        ))}
      </div>
    </section>
  );
};

// Usage — swap visuals for real Next.js <Image> components
const DEFAULT_STEPS: Step[] = [
  {
    number: "01",
    heading: "We uncover your story",
    body: "We dig deep into your brand, surface what makes you irreplaceable, and shape it into sharp positioning and a website strategy that connects in seconds.",
    visual: (
      // Replace with: <Image src="/step-01.jpg" alt="..." fill className="object-cover" />
      <div className="h-full w-full bg-[#111109]" />
    ),
  },
  {
    number: "02",
    heading: "We shape your digital presence",
    body: "With your narrative locked, we design and direct a brand and website that feels premium, signals credibility, and gives your audience one clear reason to lean in and act.",
    visual: (
      // Replace with: <Image src="/step-02.jpg" alt="..." fill className="object-cover" />
      <div className="h-full w-full bg-[#0e0e12]" />
    ),
  },
];

export default ProcessSteps;
