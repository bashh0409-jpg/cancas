"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const IMAGES = [
  "/images/img1.jpeg",
  "/images/img2.jpeg",
  "/images/img3.jpeg",
  "/images/img4.jpeg",
  "/images/img5.jpeg",
  "/images/img6.jpeg",
  "/images/img7.jpeg",
  "/images/img8.webp",
  "/images/img9.webp",
  "/images/img10.webp",
  "/images/img11.jpeg",
  "/images/img12.jpeg",
];

export default function ScrollImageTrail() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRefs = useRef<HTMLDivElement[]>([]);
  const lastIndex = useRef(-1);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const container = containerRef.current;
    if (!section || !container) return;

    const ctx = gsap.context(() => {
      const total = IMAGES.length;

      const triggerImage = (index: number) => {
        const el = imageRefs.current[index];
        if (!el) return;

        const width = container.clientWidth;
        const height = container.clientHeight;

        // Spread left -> right across the section, with slight vertical stagger
        const x = (index / (total - 1)) * (width - 200) + 100;
        const y = height / 2 + (index % 2 === 0 ? -40 : 40);

        gsap.killTweensOf(el);
        gsap.set(el, { x, y, xPercent: -50, yPercent: -50 });

        gsap.fromTo(
          el,
          { opacity: 0, scale: 0.8 },
          {
            opacity: 1,
            scale: 1,
            duration: 0.25,
            ease: "power3.out",
            onComplete: () => {
              gsap.to(el, {
                opacity: 0,
                scale: 0.8,
                duration: 0.2,
                delay: 0.15,
                ease: "power2.in",
              });
            },
          },
        );
      };

      ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: `+=${total * 250}`, // scroll distance = how long it stays pinned
        pin: true,
        scrub: true,
        onUpdate: (self) => {
          const index = Math.min(total - 1, Math.floor(self.progress * total));

          if (index !== lastIndex.current) {
            // handle scrolling both down and up smoothly,
            // triggering every index passed over (not just the nearest one)
            const step = index > lastIndex.current ? 1 : -1;
            let i = lastIndex.current === -1 ? index : lastIndex.current;
            while (i !== index) {
              i += step;
              triggerImage(i);
            }
            triggerImage(index);
            lastIndex.current = index;
          }
        },
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={sectionRef} className="relative w-full h-screen overflow-hidden">
      <div ref={containerRef} className="relative w-full h-full">
        {IMAGES.map((src, i) => (
          <div
            key={i}
            ref={(el) => {
              if (el) imageRefs.current[i] = el;
            }}
            className="absolute w-[16rem] h-[24rem] overflow-hidden pointer-events-none opacity-0"
            style={{ top: 0, left: 0 }}
          >
            <img src={src} className="w-full h-full object-cover" alt="" />
          </div>
        ))}
      </div>
    </div>
  );
}
