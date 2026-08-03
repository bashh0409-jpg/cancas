"use client";

import { Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

interface FaqItemProps {
  index: string;
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}

const faqs: Omit<FaqItemProps, "isOpen" | "onToggle">[] = [
  {
    index: "a.]",
    question: "What is Reflow?",
    answer:
      "Reflow is a creative workspace that brings AI, visual tools, and your ideas together in one place.",
  },
  {
    index: "b.]",
    question: "What can I do with Reflow?",
    answer:
      "Create, edit, experiment, and build visual experiences using AI-powered creative tools.",
  },
  {
    index: "c.]",
    question: "Who is Reflow for?",
    answer:
      "Reflow is built for creators, designers, developers, and anyone who wants to turn ideas into reality.",
  },
  {
    index: "d.]",
    question: "Does Reflow use AI?",
    answer:
      "Yes. Reflow brings multiple AI models and creative capabilities into a single workspace.",
  },
  {
    index: "e.]",
    question: "Can I upload my own files?",
    answer:
      "Yes. You can bring your own images, videos, and other creative assets into your workspace.",
  },
  {
    index: "f.]",
    question: "Can I export my work?",
    answer:
      "Yes. Reflow supports exporting your creations in formats such as PNG, JPEG, WebP, SVG, and PDF.",
  },
  {
    index: "g.]",
    question: "Is Reflow free?",
    answer:
      "Reflow offers a free experience, with additional capabilities available through paid plans.",
  },
  {
    index: "h.]",
    question: "Is Reflow still in development?",
    answer:
      "Yes. Reflow is continuously evolving as we add new tools, models, effects, and creative workflows.",
  },
];

function FaqItem({ index, question, answer, isOpen, onToggle }: FaqItemProps) {
  const answerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = answerRef.current;

    if (!element) return;

    gsap.killTweensOf(element);

    if (isOpen) {
      gsap.fromTo(
        element,
        {
          height: 0,
          opacity: 0,
        },
        {
          height: "auto",
          opacity: 1,
          duration: 0.5,
          ease: "power3.out",
        },
      );
    } else {
      gsap.to(element, {
        height: 0,
        opacity: 0,
        duration: 0.35,
        ease: "power3.inOut",
      });
    }

    return () => {
      gsap.killTweensOf(element);
    };
  }, [isOpen]);

  return (
    <div className="mb-8 w-full font-mono">
      <div className="border-b-2 mb-4 border-dashed border-white/30 pb-2">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isOpen}
          className={`grid w-full grid-cols-[35%_65%] text-left transition-colors duration-200 ${
            isOpen ? "bg-white text-black" : "hover:bg-white hover:text-black"
          }`}
        >
          {/* Index */}
          <div className="flex items-center px-0 text-sm">
            <span>{index}</span>
          </div>

          {/* Question area */}
          <div className="grid min-w-0 grid-cols-[16px_1fr_16px_auto] items-stretch">
            {/* Left divider */}
            <div className="relative bg-[#101010]">
              <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 border-l-2 border-dashed border-white/30" />
            </div>

            {/* Question */}
            <div className="flex min-w-0 items-center px-4">
              <span className="text-sm uppercase leading-tight tracking-tight">
                {question}
              </span>
            </div>

            {/* Right divider */}
            <div className="relative bg-[#101010]">
              <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 border-l-2 border-dashed border-white/30" />
            </div>

            {/* Plus */}
            <div className="flex  items-center justify-center px-3">
              <Plus
                className={`h-4 w-4 transition-transform duration-300 ${
                  isOpen ? "rotate-45" : ""
                }`}
              />
            </div>
          </div>
        </button>
      </div>

      {/* Answer uses the exact same 25/75 column structure */}
      <div
        ref={answerRef}
        className="grid w-full grid-cols-[35%_65%] overflow-hidden uppercase"
        style={{ height: 0, opacity: 0 }}
      >
        <div />

        <div className="grid grid-cols-[16px_1fr_16px_auto]">
          <div />

          <p className="max-w-xl py-4 pl-4 pr-8 text-sm leading-tight text-[#6b6b6b]">
            {answer}
          </p>

          <div />

          <div />
        </div>
      </div>
    </div>
  );
}

export default function Faq() {
  const [openIndex, setOpenIndex] = useState<string | null>(null);

  return (
    <section className="w-full">
      {faqs.map((faq) => (
        <FaqItem
          key={faq.index}
          {...faq}
          isOpen={openIndex === faq.index}
          onToggle={() =>
            setOpenIndex((current) =>
              current === faq.index ? null : faq.index,
            )
          }
        />
      ))}
    </section>
  );
}
