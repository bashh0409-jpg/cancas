"use client";

import Image from "next/image";
import { useLayoutEffect, useRef, type MouseEvent } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { User } from "@supabase/supabase-js";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const IMAGES = [
  {
    src: "/images/img1.jpeg",
    className: "left-[2%] top-[32%] w-[16%] sm:w-[11%] md:w-[9%]",
  },
  {
    src: "/images/img2.jpeg",
    className: "left-[27%] top-[6%] w-[22%] sm:w-[15%] md:w-[13%]",
  },
  
  {
    src: "/images/img4.jpeg",
    className: "right-[25%] top-[10%] w-[16%] sm:w-[11%] md:w-[9%]",
  },
  {
    src: "/images/img5.jpeg",
    className: "right-[3%] top-[38%] w-[22%] sm:w-[16%] md:w-[14%]",
  },
  {
    src: "/images/img6.jpeg",
    className: "left-[10%] bottom-[9%] w-[20%] sm:w-[14%] md:w-[12%]",
  },
  {
    src: "/images/img7.jpeg",
    className: "left-[28%] bottom-[10%] w-[14%] sm:w-[9%] md:w-[15%]",
  },
  {
    src: "/images/img8.webp",
    className: "right-[20%] bottom-[7%] w-[23%] sm:w-[17%] md:w-[15%]",
  },
];

// How tall each image is once aligned into the row, and the gap between them.
const ROW_HEIGHT = 120;
const ROW_GAP = 16;

interface HomeClientProps {
  user: User | null;
}

export default function Hero({ user }: HomeClientProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const textRef = useRef<HTMLDivElement | null>(null);
  const imageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const isAligningRef = useRef(false); // true once scroll-driven alignment has started

  useLayoutEffect(() => {
    const container = containerRef.current;
    const section = sectionRef.current;
    const text = textRef.current;

    if (!container || !section || !text) return;

    const ctx = gsap.context(() => {
      let scrollTriggerInstance: ScrollTrigger | undefined;

      const build = () => {
        // Reset any residual transforms from a previous build (e.g. after resize)
        // so measurements below reflect natural, untransformed layout.
        imageRefs.current.forEach(
          (el) => el && gsap.set(el, { clearProps: "transform" }),
        );

        const containerRect = container.getBoundingClientRect();
        const rects = imageRefs.current.map((el) =>
          el!.getBoundingClientRect(),
        );

        // Uniform height per image, width scaled proportionally to preserve aspect ratio.
        const scales = rects.map((r) => ROW_HEIGHT / r.height);
        const widths = rects.map((r, i) => r.width * scales[i]);
        const totalWidth =
          widths.reduce((sum, w) => sum + w, 0) + ROW_GAP * (widths.length - 1);

        const startX =
          containerRect.left + (containerRect.width - totalWidth) / 2;
        const targetCenterY = containerRect.top + containerRect.height / 2;

        let cursor = startX;
        const targets = rects.map((r, i) => {
          const targetCenterX = cursor + widths[i] / 2;
          cursor += widths[i] + ROW_GAP;

          const fromCenterX = r.left + r.width / 2;
          const fromCenterY = r.top + r.height / 2;

          return {
            x: targetCenterX - fromCenterX,
            y: targetCenterY - fromCenterY,
            scale: scales[i],
          };
        });

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: "+=70%",
            scrub: true,
            pin: true,
            anticipatePin: 1, // engages pin a frame early so fast scrolls don't skip past it
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              isAligningRef.current = self.progress > 0.02;
            },
            onLeave: () => {
              isAligningRef.current = false;
            },
          },
        });

        imageRefs.current.forEach((el, i) => {
          if (!el) return;
          tl.to(
            el,
            {
              x: targets[i].x,
              y: targets[i].y,
              scale: targets[i].scale,
              rotation: 0,
              ease: "none",
              duration: 0.5,
            },
            0,
          );
        });

        tl.to(
          text,
          { yPercent: -40, opacity: 1, ease: "none", duration: 1 },
          0,
        );

        scrollTriggerInstance = tl.scrollTrigger;
      };

      build();

      // Rebuild on resize since target row positions/sizes depend on viewport dimensions.
      let resizeTimeout: ReturnType<typeof setTimeout>;
      const handleResize = () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          scrollTriggerInstance?.kill();
          build();
          ScrollTrigger.refresh();
        }, 200);
      };

      window.addEventListener("resize", handleResize);

      return () => {
        clearTimeout(resizeTimeout);
        window.removeEventListener("resize", handleResize);
      };
    }, section);

    return () => ctx.revert(); // kills timeline, ScrollTrigger, and resets inline styles
  }, []);

  const handleEnter = (index: number) => {
    if (isAligningRef.current) return; // don't fight the scroll-scrubbed tween

    const element = imageRefs.current[index];
    if (!element) return;

    gsap.killTweensOf(element);
    gsap.to(element, {
      scale: 1.2,
      rotation: index % 2 === 0 ? 3 : -3,
      duration: 0.45,
      ease: "power3.out",
      zIndex: 50,
    });
  };

  const handleMove = (event: MouseEvent<HTMLDivElement>, index: number) => {
    if (isAligningRef.current) return;

    const element = imageRefs.current[index];
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const mouseX = event.clientX - (rect.left + rect.width / 2);
    const mouseY = event.clientY - (rect.top + rect.height / 2);

    gsap.to(element, {
      x: mouseX * 0.12,
      y: mouseY * 0.12,
      duration: 0.3,
      ease: "power2.out",
      overwrite: true,
    });
  };

  const handleLeave = (index: number) => {
    if (isAligningRef.current) return;

    const element = imageRefs.current[index];
    if (!element) return;

    gsap.killTweensOf(element);
    gsap.to(element, {
      scale: 1,
      x: 0,
      y: 0,
      rotation: 0,
      duration: 0.6,
      ease: "elastic.out(1, 0.5)",
      onComplete: () => {
        gsap.set(element, { zIndex: 1 });
      },
    });
  };

  const accountHref = user ? "/work" : "/signin";
  const accountLabel = user ? "Workspace" : "Sign in";

  return (
    <section
      ref={sectionRef}
      className="relative h-screen min-h-[600px] w-full overflow-hidden"
    >
      {/* Images */}
      <div ref={containerRef} className="absolute inset-0">
        {IMAGES.map((image, index) => (
          <div
            key={image.src}
            ref={(element) => {
              imageRefs.current[index] = element;
            }}
            onMouseEnter={() => handleEnter(index)}
            onMouseMove={(event) => handleMove(event, index)}
            onMouseLeave={() => handleLeave(index)}
            className={`absolute mix-blend-difference cursor-pointer overflow-hidden ${image.className}`}
            style={{
              zIndex: 1,
              willChange: "transform",
            }}
          >
            <Image
              src={image.src}
              alt=""
              width={800}
              height={800}
              loading="eager"
              priority={index < 4}
              className="block h-auto w-full object-cover"
            />
          </div>
        ))}
      </div>

      {/* Content */}
      <div
        ref={textRef}
        className="absolute inset-0 z-20 mix-blend-difference flex flex-col items-center justify-center px-4 text-center font-mono uppercase leading-tight text-white"
      >
        <h1 className="max-w-xl mix-blend-difference text-6xl sm:text-7xl uppercase capitalize tracking-tighter">
          Your creativity, powered by AI
        </h1>
        <div className="mt-6 flex items-center justify-center gap-2">
          <a
            href={accountHref}
            className="w-fit cursor-pointer rounded-full bg-white px-2 py-1 text-sm uppercase text-black"
          >
            {user && <span className="mr-1 inline-block">open</span>}
            {accountLabel}
          </a>
        </div>
      </div>
    </section>
  );
}
