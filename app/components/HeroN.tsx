"use client";

import Image from "next/image";
import { useRef } from "react";
import gsap from "gsap";

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
    src: "/images/img3.jpeg",
    className: "left-[19%] top-[27%] w-[17%] sm:w-[12%] md:w-[10%]",
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

export default function Hero() {
  const imageRefs = useRef<(HTMLDivElement | null)[]>([]);

  const handleEnter = (index: number) => {
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

  const handleMove = (
    event: React.MouseEvent<HTMLDivElement>,
    index: number,
  ) => {
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
        gsap.set(element, {
          zIndex: 1,
        });
      },
    });
  };

  return (
    <section className="relative h-screen min-h-[600px] w-full overflow-hidden ">
      {/* Images */}
      <div className="absolute inset-0">
        {IMAGES.map((image, index) => (
          <div
            key={image.src}
            ref={(element) => {
              imageRefs.current[index] = element;
            }}
            onMouseEnter={() => handleEnter(index)}
            onMouseMove={(event) => handleMove(event, index)}
            onMouseLeave={() => handleLeave(index)}
            className={`absolute cursor-pointer overflow-hidden ${image.className}`}
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
              priority={index < 4}
              className="block h-auto w-full object-cover"
            />
          </div>
        ))}
      </div>

      {/* Center */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-4 ">
        <h1 className="max-w-4xl mix-blend-difference text-center text-4xl font-medium uppercase leading-[0.95] tracking-[-0.06em] z-10 sm:text-4xl md:text-6xl lg:text-5xl">
          Explore really coolest
          <br />
          things with Reflow
        </h1>
      </div>
    </section>
  );
}
