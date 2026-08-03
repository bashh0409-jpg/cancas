"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

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

const MOBILE_IMAGE_COUNT = IMAGES.length;
const THRESHOLD_MS = 120;

export default function MouseImageTrail() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const imageRefs = useRef<HTMLDivElement[]>([]);

  const imageIndex = useRef(0);
  const lastMoveTime = useRef(0);
  const lastScrollProgress = useRef(-1);

  const resetTrail = () => {
    imageIndex.current = 0;
    lastScrollProgress.current = -1;

    imageRefs.current.forEach((element) => {
      if (!element) return;

      gsap.killTweensOf(element);

      gsap.set(element, {
        opacity: 0,
        scale: 0.75,
        rotation: 0,
      });
    });
  };

  const showImage = (
    x: number,
    y: number,
    direction = 1,
    permanent = false,
  ) => {
    const images = imageRefs.current;

    if (!images.length) return;

    const element = images[imageIndex.current % images.length];

    imageIndex.current += 1;

    if (!element) return;

    const isDesktop = typeof window !== "undefined" && window.innerWidth >= 768;

    const otherFadeDuration = isDesktop ? 0.5 : 0.5;

    images.forEach((item) => {
      if (!item || item === element) return;

      gsap.killTweensOf(item);

      gsap.to(item, {
        opacity: 0,
        scale: 0.75,
        duration: otherFadeDuration,
        ease: "power2.out",
      });
    });

    gsap.killTweensOf(element);

    gsap.set(element, {
      x,
      y,
      xPercent: -50,
      yPercent: -50,
      opacity: 0,
      scale: 0.75,
      rotation: direction * 0,
    });

    gsap.to(element, {
      opacity: 1,
      scale: 1,
      rotation: direction * 0,
      duration: 0.9,
      ease: "power3.out",
    });

    if (!permanent) {
      gsap.to(element, {
        opacity: 0,
        scale: 0.5,
        rotation: direction * 0,
        duration: 0.8,
        delay: 0.8,
        ease: "power2.in",
      });
    }
  };

  useEffect(() => {
    const hero = heroRef.current;

    if (!hero) return;

    const handleMouseMove = (event: MouseEvent) => {
      if (window.innerWidth < 768) return;

      const now = performance.now();

      if (now - lastMoveTime.current < THRESHOLD_MS) return;

      lastMoveTime.current = now;

      const rect = hero.getBoundingClientRect();

      showImage(event.clientX - rect.left, event.clientY - rect.top, 1);
    };

    hero.addEventListener("mousemove", handleMouseMove);

    return () => {
      hero.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    const hero = heroRef.current;

    if (!section || !hero) return;

    const handleScroll = () => {
      if (window.innerWidth >= 768) return;

      const rect = section.getBoundingClientRect();

      const isBefore = rect.top > 0;
      const isAfter = rect.bottom <= window.innerHeight;
      const isActive = rect.top <= 0 && rect.bottom > window.innerHeight;

      if (isBefore || isAfter) {
        if (lastScrollProgress.current !== -1) {
          resetTrail();
        }

        return;
      }

      if (!isActive) return;

      const scrollableDistance = section.offsetHeight - window.innerHeight;

      if (scrollableDistance <= 0) return;

      const travelled = Math.max(0, Math.min(scrollableDistance, -rect.top));

      const progress = travelled / scrollableDistance;

      const imageStage = Math.min(
        MOBILE_IMAGE_COUNT - 1,
        Math.floor(progress * MOBILE_IMAGE_COUNT),
      );

      if (imageStage === lastScrollProgress.current) return;

      lastScrollProgress.current = imageStage;

      const heroRect = hero.getBoundingClientRect();

      const positions: [number, number][] = Array.from({ length: 24 }, () => [
        0.15 + Math.random() * 0.7,
        0.15 + Math.random() * 0.7,
      ]);

      const [xPercent, yPercent] = positions[imageStage] ?? [0.5, 0.5];

      const x = heroRect.width * xPercent;
      const y = heroRect.height * yPercent;

      const direction = imageStage % 2 === 0 ? 1 : -1;

      showImage(x, y, direction, true);
    };

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    window.addEventListener("resize", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  useEffect(() => {
    return () => {
      imageRefs.current.forEach((element) => {
        if (element) {
          gsap.killTweensOf(element);
        }
      });
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="
        relative
        z-0
        h-[250vh]
        w-full
        mix-blend-difference
        md:h-screen
      "
    >
      <div
        ref={heroRef}
        className="
          sticky
          top-0
          z-[60]
          h-screen
          w-full
          overflow-hidden
          bg-[#101010]
        "
        style={{
          minHeight: "100svh",
        }}
      >
        {IMAGES.map((src, index) => (
          <div
            key={src}
            ref={(element) => {
              if (element) {
                imageRefs.current[index] = element;
              }
            }}
            className="
              pointer-events-none
              absolute
              left-0
              top-0
              mix-blend-difference
              h-[20rem]
              w-[13rem]
              overflow-hidden
              opacity-0
              sm:h-[24rem]
              sm:w-[16rem]
            "
            style={{
              zIndex: index + 1,
              willChange: "transform, opacity",
            }}
          >
            <img
              src={src}
              alt=""
              draggable={false}
              className="h-full w-full object-cover mix-blend-difference"
            />
          </div>
        ))}

        <div
          className="
            pointer-events-none
            absolute
            inset-0
            z-20
            flex
            items-center
            justify-center
            px-6 mix-blend-difference
          "
        >
          <p
            className="
              w-full
              max-w-4xl
              text-center
              text-4xl
              font-medium
              uppercase
              tracking-tighter
              text-white
              sm:text-4xl
              mix-blend-difference
            "
          >
            Explore really cool ways to create, experiment, and bring your ideas
            to life with Reflow.
          </p>
        </div>
      </div>
    </section>
  );
}
