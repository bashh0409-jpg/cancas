"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

interface BounceInTextProps {
  text: string;
}

export default function BounceInText({ text }: BounceInTextProps) {
  const containerRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useGSAP(
    () => {
      const container = containerRef.current;
      const title = titleRef.current;

      if (!container || !title) return;

      const split = SplitText.create(title, {
        type: "chars",
      });

      // Start characters scattered so they assemble as they enter.
      gsap.set(split.chars, {
        yPercent: () => gsap.utils.random(-100, 100),
        rotation: () => gsap.utils.random(-45, 45),
        willChange: "transform",
      });

      // Start the entire text just outside the right edge.
      gsap.set(title, {
        x: () => window.innerWidth,
      });

      const getDistance = () => {
        const titleWidth = title.getBoundingClientRect().width;

        // Distance required to move the entire title from right → left.
        return window.innerWidth + titleWidth;
      };

      const moveTween = gsap.to(title, {
        x: () => -title.getBoundingClientRect().width,

        ease: "none",

        scrollTrigger: {
          trigger: container,

          // Pin exactly when the section reaches the viewport top.
          start: "top top",

          // Scroll distance is exactly enough for the entire title
          // to disappear past the left edge.
          end: () => `+=${getDistance()}`,

          scrub: 1,

          pin: true,

          anticipatePin: 1,

          invalidateOnRefresh: true,
        },
      });

      split.chars.forEach((char) => {
        gsap.to(char, {
          yPercent: 0,
          rotation: 0,

          ease: "back.out(1.7)",

          scrollTrigger: {
            trigger: char,
            containerAnimation: moveTween,

            start: "left 90%",
            end: "left 50%",

            horizontal: true,

            scrub: 0.8,
          },
        });
      });

      return () => {
        split.revert();
      };
    },
    {
      scope: containerRef,
    },
  );

  return (
    <section ref={containerRef} className="relative h-screen w-full">
      <div className="flex h-screen w-full items-center overflow-hidden">
        <h2
          ref={titleRef}
          className="
            whitespace-nowrap
            text-[40.2vw]
            font-medium
            leading-none
            tracking-[-0.08em]
            text-black grotesk
            will-change-transform
            md:text-[20vw] pr-20
            lg:text[12vw]
            mix-blend-difference
          "
        >
          {text} <span className="italic font-mono">R</span>eflow?
        </h2>
      </div>
    </section>
  );
}
