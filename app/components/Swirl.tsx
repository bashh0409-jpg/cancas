"use client";

import React, { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/all";

const WORDS = [
  "CREATE",
  "EXPLORE",
  "IMAGINE",
  "GENERATE",
  "REFINE",
  "CONNECT",
  "COLLABORATE",
  "EXPERIMENT",
  "ITERATE",
  "CREATE",
  "REFLOW",
];

gsap.registerPlugin(ScrollTrigger, useGSAP);

const Swirl = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add(
        {
          isDesktop: "(min-width: 1024px)",
          isMobile: "(max-width: 1023px)",
        },
        (context) => {
          const { isDesktop = false } = context.conditions || {};

          const texts = gsap.utils.toArray<HTMLElement>(".animated-word");

          const contentContainer =
            containerRef.current?.querySelector<HTMLElement>(
              ".content-container",
            );

          if (!contentContainer || !texts.length) return;

          const minX = isDesktop ? -40 : -12;
          const maxX = isDesktop ? 40 : 12;
          const range = maxX - minX;

          const waveNumber = 0.5;
          const waveSpeed = 1.2;

          const quickSetters = texts.map((text) =>
            gsap.quickTo(text, "x", {
              duration: 0.6,
              ease: "power4.out",
            }),
          );

          texts.forEach((text, index) => {
            const phase = waveNumber * index - Math.PI / 2;

            const wave = Math.sin(phase);
            const progress = (wave + 1) / 2;

            gsap.set(text, {
              x: minX + progress * range,
            });
          });

          const trigger = ScrollTrigger.create({
            trigger: contentContainer,
            start: "top bottom",
            end: "bottom top",
            scrub: 1,

            onUpdate: (self) => {
              const viewportCenter = window.innerHeight / 2;

              let closestIndex = 0;
              let closestDistance = Infinity;

              texts.forEach((text, index) => {
                const rect = text.getBoundingClientRect();

                const center = rect.top + rect.height / 2;

                const distance = Math.abs(center - viewportCenter);

                if (distance < closestDistance) {
                  closestDistance = distance;
                  closestIndex = index;
                }
              });

              texts.forEach((text, index) => {
                const phase =
                  waveNumber * index +
                  waveSpeed +
                  self.progress * Math.PI * 2 -
                  Math.PI / 2;

                const wave = Math.sin(phase);
                const progress = (wave + 1) / 2;

                const x = minX + progress * range;

                quickSetters[index](x);

                text.classList.toggle("text-white", index === closestIndex);

                text.classList.toggle("text-[#4d4d4d]", index !== closestIndex);
              });
            },
          });

          return () => trigger.kill();
        },
      );

      return () => mm.revert();
    },
    { scope: containerRef },
  );

  return (
    <div ref={containerRef} className="overflow-hidden">
      <div className="h-[50vh]" />

      <div
        className="
          content-container
          mx-auto
          max-w-[1400px]
          px-6 flex
          justify-end items-center
          text-[10vw]
          font-semibold
          leading-[0.9]
          tracking-[-0.04em]
          lg:px-12
          lg:text-[7vw]
        "
      >
        <p className="flex flex-wrap justify-start gap-x-6 gap-y-2 text-right">
          {WORDS.map((word) => (
            <span
              key={word}
              className="
                animated-word
                inline-block
                text-[#4d4d4d]
                transition-colors
                duration-150
                ease-out tracking-[-0.1em]
                will-change-transform
              "
            >
              {word}
            </span>
          ))}
        </p>
      </div>

      <div className="h-[50vh]" />
    </div>
  );
};

export default Swirl;
