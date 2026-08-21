"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef } from "react";
import "./mwg_022.css";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export interface MWG_022_Paragraph {
  text: string;
}

export interface MWG_022_TypographyRevealProps {
  /** Title text displayed in the header bar (desktop only) */
  title?: string;
  /** Exclamation/logo character in the top-right */
  logoChar?: string;
  /** Array of paragraph objects that animate through on large screens */
  paragraphs?: MWG_022_Paragraph[];
  /** Short paragraph(s) shown as static text on small screens */
  mobileParagraphs?: string[];
  /** Background color class (tailwind or custom) */
  bgClass?: string;
  /** Text color */
  textColor?: string;
  /** Accent color for the logo char */
  accentColor?: string;
  /** Border color for the divider */
  borderColor?: string;
  /** Snap points for scroll positions (0 to 1), desktop only */
  snapPoints?: number[];
  /** Height of the pin container in vh units, desktop only */
  pinHeight?: number;
}

export function MWG_022_TypographyReveal({
  title = "What Reflow does best",
  paragraphs = [
    {
      text: "One canvas for your ideas, files, images, and conversations. Everything stays connected as your thinking evolves.",
    },
    {
      text: "AI helps you explore ideas, create content, summarize information, and connect concepts without breaking your flow.",
    },
    {
      text: "Research, plan, design, and create in one flexible workspace where human creativity and AI work together.",
    },
  ],
  mobileParagraphs = [
    "One canvas for your ideas, files, images, and conversations. Everything stays connected as your thinking evolves.",
    "AI helps you explore, create, and connect ideas across one flexible workspace, without ever breaking your flow.",
  ],
  bgClass = "",
  textColor = "#F1F1F1",
  snapPoints = [0, 0.35, 1],
  pinHeight = 500,
}: MWG_022_TypographyRevealProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const horizontalTrackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const container = containerRef.current;
    const horizontalTrack = horizontalTrackRef.current;

    if (!section || !container || !horizontalTrack) return;

    const mm = gsap.matchMedia();

    mm.add("(max-width: 768px)", () => {
      const ctx = gsap.context(() => {
        const pinHeightEl = section.querySelector(".typography-pin-height");
        if (!pinHeightEl) return;

        const horizontalDistance = Math.max(
          0,
          horizontalTrack.scrollWidth - window.innerWidth,
        );

        gsap.set(horizontalTrack, { x: 0 });

        gsap.to(horizontalTrack, {
          x: -horizontalDistance,
          ease: "none",
          scrollTrigger: {
            trigger: pinHeightEl,
            start: "top top",
            end: "bottom bottom",
            scrub: true,
          },
        });

        ScrollTrigger.create({
          trigger: pinHeightEl,
          start: "top top",
          end: "bottom bottom",
          pin: container,
          pinSpacing: false,
          anticipatePin: 1,
        });

        ScrollTrigger.refresh();
      }, section);

      return () => ctx.revert();
    });

    mm.add("(min-width: 769px)", () => {
      const ctx = gsap.context(() => {
        const pinHeightEl = section.querySelector(".typography-pin-height");
        const paragraphsEls = section.querySelectorAll<HTMLElement>(
          ".typography-paragraph",
        );

        if (!pinHeightEl || !paragraphsEls.length) return;

        // Prevent duplicate word wrappers on re-run.
        paragraphsEls.forEach((paragraph) => {
          if (paragraph.querySelector(".typo-word")) return;

          const text = paragraph.textContent || "";

          paragraph.innerHTML = text
            .split(" ")
            .map(
              (word) => `<span class="typo-word"><span>${word}</span></span>`,
            )
            .join(" ");
        });

        const horizontalDistance = Math.max(
          0,
          horizontalTrack.scrollWidth - window.innerWidth,
        );

        gsap.to(horizontalTrack, {
          x: -horizontalDistance,
          ease: "none",
          scrollTrigger: {
            trigger: pinHeightEl,
            start: "top top",
            end: "bottom bottom",
            scrub: 1,
          },
        });

        ScrollTrigger.create({
          trigger: pinHeightEl,
          start: "top top",
          end: "bottom bottom",
          pin: container,
          pinSpacing: false,
          snap: {
            snapTo: snapPoints,
            duration: { min: 0.2, max: 0.5 },
            delay: 0.1,
            ease: "power1.inOut",
          },
        });

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: pinHeightEl,
            start: "top top",
            end: "80% bottom",
            scrub: true,
          },
        });

        paragraphsEls.forEach((paragraph, index) => {
          const nextParagraph = paragraphsEls[index + 1];

          if (!nextParagraph) return;

          tl.to(paragraph.querySelectorAll(".typo-word span"), {
            y: "100%",
            duration: 1,
            stagger: 0.2,
            ease: "power4.in",
          });

          tl.to(
            nextParagraph.querySelectorAll(".typo-word span"),
            {
              y: "0%",
              duration: 1,
              delay: 1,
              stagger: 0.2,
              ease: "power4.out",
            },
            "<",
          );
        });

        ScrollTrigger.refresh();
      }, section);

      return () => ctx.revert();
    });

    return () => mm.revert();
  }, [paragraphs, snapPoints]);

  return (
    <section
      ref={sectionRef}
      className={`typography-section ${bgClass}`}
      style={{
        position: "relative",
        width: "100%",
        overflow: "hidden",
      }}
    >
      <div
        className="typography-pin-height"
        style={{
          height: `${pinHeight}vh`,
          width: "100%",
        }}
      >
        <div
          ref={containerRef}
          className="border-none typography-container"
          style={{
            height: "100vh",
            position: "sticky",
            top: 30,
            width: "100%",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Header bar — desktop only */}
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
            <p
              className="hidden"
              style={{
                fontSize: "4vw",
                lineHeight: 1,
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

          {/* Animated paragraphs — desktop only */}
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
            {paragraphs.map((paragraph, index) => (
              <p
                key={index}
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
                  overflow: "hidden",
                }}
              >
                {paragraph.text}
              </p>
            ))}
          </div>

          {/* Static short paragraph(s) — mobile only */}
          <div className="mobile-paragraph" style={{ color: textColor }}>
            {mobileParagraphs.map((text, index) => (
              <p key={index}>{text}</p>
            ))}
          </div>

          {/* Horizontally scrolling row */}
          <div className="typography-boxes-row" style={{ flexShrink: 0 }}>
            <div
              ref={horizontalTrackRef}
              className="typography-boxes-track"
              style={{ willChange: "transform" }}
            >
              <div className="typography-box" />
              <div className="typography-box" />
              <div className="typography-box" />
              <div className="typography-box" />
              <div className="typography-box" />
              <div className="typography-box" />
              <div className="typography-box" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
