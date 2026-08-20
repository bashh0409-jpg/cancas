"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef } from "react";
import "./mwg_022.css";

// Register GSAP plugins
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export interface MWG_022_Paragraph {
  text: string;
}

export interface MWG_022_TypographyRevealProps {
  /** Title text displayed in the header bar */
  title?: string;
  /** Exclamation/logo character in the top-right */
  logoChar?: string;
  /** Array of paragraph objects to animate through */
  paragraphs?: MWG_022_Paragraph[];
  /** Background color class (tailwind or custom) */
  bgClass?: string;
  /** Text color */
  textColor?: string;
  /** Accent color for the logo char */
  accentColor?: string;
  /** Border color for the divider */
  borderColor?: string;
  /** Snap points for scroll positions (0 to 1) */
  snapPoints?: number[];
  /** Height of the pin container in vh units */
  pinHeight?: number;
}

export function MWG_022_TypographyReveal({
  title = "What Reflow does best",
  paragraphs = [
    {
      text: "Reflow brings your ideas, notes, files, images, and conversations into one visual workspace. Instead of switching between multiple apps, you can organize everything in a single canvas that evolves as your thinking does.",
    },
    {
      text: "Powered by AI, Reflow helps you explore ideas faster by generating content, summarizing information, creating visuals, and connecting related concepts. It's designed to reduce friction so you can spend more time creating and less time managing tools.",
    },
    {
      text: "Whether you're planning a project, conducting research, designing a product, or brainstorming your next big idea, Reflow gives you a flexible workspace where documents, media, and AI work together seamlessly in real time.",
    },
  ],
  bgClass = "",
  textColor = "#F1F1F1",
  accentColor = "var(--color-brand-600, #6366f1)",
  borderColor = "rgb(73, 73, 73)",
  snapPoints = [0, 0.35, 1],
  pinHeight = 500,
}: MWG_022_TypographyRevealProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const container = containerRef.current;
    if (!section || !container) return;

    const ctx = gsap.context(() => {
      const pinHeightEl = section.querySelector(".typography-pin-height");
      const paragraphsEls = section.querySelectorAll(".typography-paragraph");

      // Wrap words in spans
      paragraphsEls.forEach((paragraph) => {
        const text = paragraph.textContent || "";
        if (text.trim()) {
          paragraph.innerHTML = text
            .split(" ")
            .map(
              (word) => `<span class="typo-word"><span>${word}</span></span>`,
            )
            .join(" ");
        }
      });

      // Pin the container with snap points
      ScrollTrigger.create({
        trigger: pinHeightEl,
        start: "top top",
        end: "bottom bottom",
        pin: container,
        snap: {
          snapTo: snapPoints,
          duration: { min: 0.2, max: 0.5 },
          delay: 0.1,
          ease: "power1.inOut",
        },
      });

      // Create timeline for word animations
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: pinHeightEl,
          start: "top top",
          end: "80% bottom",
          scrub: true,
        },
      });

      // Animate paragraph transitions
      paragraphsEls.forEach((paragraph, index) => {
        if (paragraphsEls[index + 1]) {
          tl.to(paragraph.querySelectorAll(".typo-word span"), {
            y: "100%",
            duration: 1,
            stagger: 0.2,
            ease: "power4.in",
          });
          tl.to(
            paragraphsEls[index + 1].querySelectorAll(".typo-word span"),
            {
              y: "0%",
              duration: 1,
              delay: 1,
              stagger: 0.2,
              ease: "power4.out",
            },
            "<",
          );
        }
      });
    }, section);

    return () => ctx.revert();
  }, [paragraphs, snapPoints]);

  return (
    <section
      ref={sectionRef}
      className={`typography-section ${bgClass}`}
      style={{ position: "relative", width: "100%", overflow: "hidden" }}
    >
      <div
        className="typography-pin-height"
        style={{ height: `${pinHeight}vh`, width: "100%" }}
      >
        <div
          ref={containerRef}
          className="border-none typography-container"
          style={{
            height: "100vh",
            position: "sticky",
            top: 0,
            width: "100%",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Header bar */}
          <div
            className="top"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "2.5vw",
              width: "100%",
            }}
          >
            <p className="hidden"
              style={{
                fontSize: "4vw",
                lineHeight: 1.0,
                letterSpacing: "-0.05em",
                fontWeight: 500,
                color: textColor,
                whiteSpace: "pre-line",
                margin: 0,
              }}
            >
              {title}
            </p>
          </div>

          {/* Paragraphs */}
          <div
            className="paragraphs"
            style={{
              display: "flex",
              alignItems: "flex-start",
              padding: "2.5vw",
              columnGap: "2.5vw",
              flex: 1,
            }}
          >
            {paragraphs.map((p, i) => (
              <p
                key={i}
                className="typography-paragraph"
                style={{
                  flex: 1,
                  fontSize: "2.3vw",
                  lineHeight: 0.9,
                  letterSpacing: "-0.03em",
                  fontWeight: 500,
                  color: textColor,
                  margin: 0,
                  position: "relative",
                }}
              >
                {p.text}
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}