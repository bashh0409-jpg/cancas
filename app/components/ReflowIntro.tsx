"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface TextItem {
  muted: string;
  main: string;
  ending: string;
}

const TEXTS: TextItem[] = [
  {
    muted: "A creative workspace that brings",
    main: "AI, ideas, and visual tools",
    ending: "together in one place.",
  },
  {
    muted: "Turn your thoughts into",
    main: "clear, visual ideas",
    ending: "without losing your flow.",
  },
  {
    muted: "Create and explore with",
    main: "powerful AI tools",
    ending: "built into your workflow.",
  },
  {
    muted: "Bring everything together on",
    main: "one flexible canvas",
    ending: "and see your ideas differently.",
  },
  {
    muted: "From the first idea to",
    main: "something worth creating",
    ending: "without breaking your momentum.",
  },
];

// Each text item is always exactly 3 lines (muted, main, ending),
// so offsets are just index * 3 — derived rather than hardcoded
// in case the shape ever changes.
const LINES_PER_TEXT = 3;
const TEXT_START_INDEX = TEXTS.map((_, i) => i * LINES_PER_TEXT);

export default function ReflowIntro() {
  const sectionRef = useRef<HTMLElement>(null);
  const linesRef = useRef<HTMLDivElement[]>([]);

  useLayoutEffect(() => {
    const section = sectionRef.current;

    if (!section) return;

    const ctx = gsap.context(() => {
      const lines = linesRef.current;

      // Hide every line, then reveal only the first text's lines.
      gsap.set(lines, { yPercent: 105 });
      gsap.set(lines.slice(0, LINES_PER_TEXT), { yPercent: 0 });

      const mm = gsap.matchMedia();

      mm.add(
        {
          isMobile: "(max-width: 767px)",
          isDesktop: "(min-width: 768px)",
        },
        (context) => {
          const { isMobile } = context.conditions as { isMobile: boolean };

          const stepDuration = isMobile ? 0.35 : 0.45;
          const stepStagger = isMobile ? 0.06 : 0.08;

          const timeline = gsap.timeline({ paused: true });

          TEXTS.forEach((_, index) => {
            if (index === 0) return;

            const previousStart = TEXT_START_INDEX[index - 1];
            const currentStart = TEXT_START_INDEX[index];
            const label = index;

            timeline
              .to(
                lines.slice(previousStart, previousStart + LINES_PER_TEXT),
                {
                  yPercent: -105,
                  duration: stepDuration,
                  stagger: stepStagger,
                  ease: "power4.inOut",
                },
                label,
              )
              .fromTo(
                lines.slice(currentStart, currentStart + LINES_PER_TEXT),
                {
                  yPercent: 105,
                },
                {
                  yPercent: 0,
                  duration: stepDuration,
                  stagger: stepStagger,
                  ease: "power4.inOut",
                },
                label,
              );
          });

          // Trailing hold: a silent no-op tween appended after the
          // final transition. This reserves scroll distance where
          // nothing animates, so the last text is fully settled
          // (not mid-tween) by the time the section unpins.
          const holdDuration = stepDuration;
          timeline.to({}, { duration: holdDuration });

          // Scale scroll distance with how many transitions exist,
          // PLUS the trailing hold, so pacing stays consistent no
          // matter how many texts are in TEXTS. Tweak the 60 / 80
          // multipliers to taste — bigger number = slower per step.
          const transitionCount = TEXTS.length - 1;
          const stepMultiplier = isMobile ? 60 : 80;
          const holdMultiplier = stepMultiplier * (holdDuration / stepDuration);
          const scrollDistance =
            transitionCount * stepMultiplier + holdMultiplier;

          const trigger = ScrollTrigger.create({
            trigger: section,
            start: "top top",
            end: `+=${scrollDistance}%`,
            pin: true,
            pinSpacing: true,
            scrub: 1,
            anticipatePin: 1,

            onUpdate: (self) => {
              timeline.progress(self.progress);
            },
          });

          return () => {
            trigger.kill();
            timeline.kill();
          };
        },
      );
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative flex h-screen w-full items-center justify-center p-3 sm:p-4"
    >
      <div className="flex w-full max-w-3xl flex-col items-center justify-center gap-6 px-4 py-3 text-center sm:gap-8 sm:px-6 sm:py-4 md:gap-12 md:p-4">
        <p className="font-mono hidden text-xs uppercase sm:text-sm">
          What it&apos;s all about?
        </p>

        <div className="w-full p-2 text-2xl font-mono tracking-tighter grotes uppercase sm:p-3 sm:text-3xl md:p-4 md:text-4xl lg:text-5xl">
          {TEXTS.map((text, textIndex) => {
            const lines = [text.muted, text.main, text.ending];

            return (
              <div
                key={textIndex}
                className="absolute left-0 right-0 flex w-full flex-col items-center"
              >
                {lines.map((line, lineIndex) => {
                  const index = TEXT_START_INDEX[textIndex] + lineIndex;

                  return (
                    <div
                      key={lineIndex}
                      className="relative w-full overflow-hidden px-2 leading-[1.15] sm:leading-[1.1] md:leading-[1.05]"
                    >
                      <div
                        ref={(element) => {
                          if (element) linesRef.current[index] = element;
                        }}
                        className={
                          lineIndex === 1 ? "text-white" : "text-[#999]"
                        }
                      >
                        {line}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
