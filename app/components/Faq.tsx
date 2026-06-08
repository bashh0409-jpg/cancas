"use client";

import { useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";

type FaqItem = {
  question: string;
  answer: string;
};

const FAQ_ITEMS: FaqItem[] = [
  {
    question: "What are credits and how do they work?",
    answer:
      "Credits are the currency for AI actions inside ENDLESS — generating images, running agents, transforming canvas content, and more. Each action costs a set number of credits. Your credits reset monthly on your billing date, and unused credits don't roll over.",
  },
  {
    question: "Can I change or cancel my plan at any time?",
    answer:
      "Yes. You can upgrade, downgrade, or cancel from your account settings at any time. Upgrades take effect immediately. Downgrades and cancellations apply at the end of your current billing period — you keep full access until then.",
  },
  {
    question: "What happens when I run out of credits?",
    answer:
      "AI-powered features will be paused until your credits reset at the start of your next billing cycle. You'll still have full access to your canvases, files, and any work you've already created. You can also upgrade mid-cycle to unlock more credits immediately.",
  },
  {
    question: "Is there a free trial for paid plans?",
    answer:
      "The Free plan gives you 100 credits per month to explore Slate at no cost — no credit card required. We don't currently offer a time-limited trial, but you can upgrade and cancel at any time with no lock-in.",
  },
  {
    question: "Which AI models does ENDLESS use?",
    answer:
      "ENDLESS uses a mix of models depending on the task — image generation, code, reasoning, and multimodal understanding each draw from the best available model for that job. Pro and Ultra plans unlock access to premium reasoning models and faster processing queues.",
  },
  {
    question: "How does billing work for annual plans?",
    answer:
      "Annual plans are billed as a single upfront payment and save you roughly two months compared to monthly billing. If you cancel early, you retain access through the end of the paid year — we don't offer partial refunds.",
  },
  {
    question: "Is my data used to train AI models?",
    answer:
      "No. Your canvases, prompts, and generated content are never used to train AI models. Your work is private to your account unless you explicitly share it. Enterprise customers can request a data processing agreement (DPA).",
  },
];

export default function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);
  const answerRefs = useRef<Array<HTMLDivElement | null>>([]);

  const toggle = (i: number) => setOpenIndex(openIndex === i ? null : i);

  // hover animation (question row lift + glow)
  const onEnter = (i: number) => {
    const el = itemRefs.current[i];
    if (!el) return;

    gsap.to(el, {
      x: 6,
      duration: 0.25,
      ease: "power2.out",
    });
  };

  const onLeave = (i: number) => {
    const el = itemRefs.current[i];
    if (!el) return;

    gsap.to(el, {
      x: 0,
      duration: 0.25,
      ease: "power2.out",
    });
  };

  // smooth accordion animation
  useLayoutEffect(() => {
    answerRefs.current.forEach((el, i) => {
      if (!el) return;

      const isOpen = openIndex === i;

      gsap.to(el, {
        height: isOpen ? "auto" : 0,
        opacity: isOpen ? 1 : 0,
        duration: 0.35,
        ease: "power2.inOut",
      });
    });
  }, [openIndex]);

  return (
    <section className="w-full bg-[#111] min-h-screen px-6 md:px-16 py-24">

      <div className="grid grid-cols-1 lg:grid-cols-3 ">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <h2 className="text-5xl flex items-center gap-2 xl:text-5xl pixel font-bold text-white leading-[1.05] tracking-tight">
            <span className="w-3 h-3 rounded-full bg-white inline-block" />
            FAQs
          </h2>
        </div>

        <div className="flex flex-col col-span-2">
          <h2 className="text-3xl mb-4 mt-2 xl:text-6xl pixel font-bold text-white leading-[1.05] tracking-tight">
            We&apos;ve heard every concern. Here&apos;s what you really need to
            know.
          </h2>

          {FAQ_ITEMS.map((item, i) => {
            const isOpen = openIndex === i;

            return (
              <div
                key={i}
                ref={(el) => {
                  itemRefs.current[i] = el;
                }}
                onMouseEnter={() => onEnter(i)}
                onMouseLeave={() => onLeave(i)}
                className="border-t border-white/10 last:border-b last:border-white/10"
              >
                <button
                  type="button"
                  onClick={() => toggle(i)}
                  className="w-full flex  hover:text-black items-center justify-between gap-6 py-5 text-left group"
                  aria-expanded={isOpen}
                >
                  <span className="text-[22px] tracking-tight text-white/80 group-hover:text-white transition-colors duration-200 leading-snug">
                    {item.question}
                  </span>

                  <span
                    className={[
                      "shrink-0 w-2 h-2 rounded-full border border-white/40 transition-all duration-300",
                      isOpen ? "bg-white border-white" : "bg-transparent",
                    ].join(" ")}
                  />
                </button>

                <div
                  ref={(el) => {
                    answerRefs.current[i] = el;
                  }}
                  style={{ overflow: "hidden", height: 0, opacity: 0 }}
                >
                  <div className="pb-5">
                    <p className="text-sm text-white/40 leading-relaxed">
                      {item.answer}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
