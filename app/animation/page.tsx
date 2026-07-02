"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger, SplitText);

export default function Page() {
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const lenis = new Lenis();

    // Track scroll velocity for the smear effect
    let velocity = 0;
    lenis.on("scroll", (e: any) => {
      ScrollTrigger.update();
      velocity = e.velocity ?? 0;
    });

    const update = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0);

    const ease = gsap.parseEase("power2.out");

    const ctx = gsap.context(() => {
      const titleHeadings = gsap.utils.toArray<HTMLElement>(".title h1");
      const splits: SplitText[] = [];

      titleHeadings.forEach((heading) => {
        const split = SplitText.create(heading, {
          type: "chars",
          charClass: "char",
        });

        splits.push(split);

        split.chars.forEach((char, i) => {
          if (char.textContent?.trim() === "") return;

          gsap.set(char, {
            y: i % 2 === 0 ? -150 : 150,
            opacity: prefersReducedMotion ? 1 : 0,
            scale: prefersReducedMotion ? 1 : 0.85,
            display: "inline-block",
          });
        });
      });

      if (prefersReducedMotion) {
        // Show final state immediately, skip scroll-driven motion
        splits.forEach((split) => {
          gsap.set(split.chars, { y: 0, opacity: 1, scale: 1 });
        });
        return;
      }

      const titles = gsap.utils.toArray<HTMLElement>(".title");
      const titleContainers = titles.map(
        (title) => title.querySelector(".title-container") as HTMLElement,
      );

      // Continuous velocity-driven smear, independent of scrub throttling
      const smear = () => {
        const v = gsap.utils.clamp(-1, 1, velocity / 40);
        const blur = Math.min(Math.abs(v) * 6, 6);
        const skew = v * 6;

        titleContainers.forEach((el) => {
          if (!el) return;
          gsap.set(el, {
            filter: blur > 0.05 ? `blur(${blur}px)` : "none",
            skewX: skew,
          });
        });
      };
      gsap.ticker.add(smear);

      titles.forEach((title, index) => {
        const titleContainer = titleContainers[index];
        const titleContainerInitialX = index === 1 ? -100 : 100;
        const split = splits[index];

        const visibleChars = split.chars.filter(
          (char) => char.textContent?.trim() !== "",
        );
        const charCount = Math.max(visibleChars.length, 1);

        ScrollTrigger.create({
          trigger: title,
          start: "top bottom",
          end: "top -25",
          scrub: 1,

          onUpdate: (self) => {
            gsap.set(titleContainer, {
              xPercent: titleContainerInitialX * (1 - self.progress),
            });

            const charStartDelay = 0.1;
            const staggerAmount = 0.45;
            const duration = Math.max(0.15, 1 - charStartDelay - staggerAmount);

            let visibleIndex = 0;

            split.chars.forEach((char, i) => {
              if (char.textContent?.trim() === "") return;

              const staggerIndex =
                index === 1 ? charCount - 1 - visibleIndex : visibleIndex;

              const start =
                charStartDelay +
                (staggerIndex / Math.max(charCount - 1, 1)) * staggerAmount;

              const rawProgress = gsap.utils.clamp(
                0,
                1,
                (self.progress - start) / duration,
              );
              const progress = ease(rawProgress);

              const initialY = i % 2 === 0 ? -150 : 150;

              gsap.set(char, {
                y: gsap.utils.interpolate(initialY, 0, progress),
                opacity: gsap.utils.interpolate(0, 1, progress),
                scale: gsap.utils.interpolate(0.85, 1, progress),
              });

              visibleIndex++;
            });
          },
        });
      });

      const handleResize = () => ScrollTrigger.refresh();
      window.addEventListener("resize", handleResize);

      return () => {
        gsap.ticker.remove(smear);
        window.removeEventListener("resize", handleResize);
      };
    }, containerRef);

    return () => {
      ctx.revert();
      gsap.ticker.remove(update);
      lenis.destroy();
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  return (
    <div ref={containerRef}>
      <section className="intro">
        <h1 className="head1 grotesk">Start scroll</h1>
      </section>

      <section className="animated-titles">
        <div className="title lime">
          <div className="title-container">
            <h1 className="head1 tracking-tight grotesk">Start</h1>
          </div>
        </div>

        <div className="title">
          <div className="title-container">
            <h1 className="head1 tracking-tight grotest">Your</h1>
          </div>
        </div>

        <div className="title lime">
          <div className="title-container">
            <h1 className="head1 tracking-tight grotesk">Way</h1>
          </div>
        </div>
      </section>

      <section className="outro">
        <h1 className="head1 grotesk">End of motion</h1>
      </section>
    </div>
  );
}
