"use client";

import { forwardRef, useId } from "react";

export interface OrbitImage {
  id: string;
  src: string;
  alt: string;
  /** Static tilt in degrees, baked in so each card reads as hand-placed rather than perfectly upright. */
  tilt?: number;
}

export interface RotatingImageOrbitProps {
  images?: OrbitImage[];
  centerLine1?: string;
  centerLine2?: string;
  /** Seconds for one full clockwise revolution. */
  duration?: number;
  className?: string;
}

// Inline SVG data URIs stand in for real artwork so the component renders fully
// self-contained with no external asset paths — swap the `src` values for real
// files once you have them, the layout math doesn't change.
const svgCard = (blocks: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="260" viewBox="0 0 200 260">${blocks}</svg>`,
  )}`;

const DEFAULT_IMAGES: OrbitImage[] = [
  {
    id: "frame",
    alt: "Nested color frame poster",
    tilt: -6,
    src: svgCard(`
      <rect width="200" height="260" fill="#5b6fd8"/>
      <rect x="16" y="18" width="168" height="224" fill="#4fae5a"/>
      <rect x="32" y="34" width="136" height="192" fill="#f0c419"/>
      <rect x="48" y="50" width="104" height="160" fill="#e8952f"/>
    `),
  },
  {
    id: "green-numeral",
    alt: "Green poster with large numerals",
    tilt: 4,
    src: svgCard(`
      <rect width="200" height="260" fill="#2fa63e"/>
      <text x="30" y="180" font-family="Arial Black, sans-serif" font-size="96" font-weight="900" fill="#7fc4ff">3.4</text>
    `),
  },
  {
    id: "mono-numerals",
    alt: "White poster with stacked numerals",
    tilt: -3,
    src: svgCard(`
      <rect width="200" height="260" fill="#e9e9ea"/>
      <text x="70" y="120" font-family="Arial Black, sans-serif" font-size="72" font-weight="900" fill="#161616">22</text>
      <text x="20" y="200" font-family="Arial Black, sans-serif" font-size="72" font-weight="900" fill="#161616">14</text>
    `),
  },
  {
    id: "stamp-grid",
    alt: "Four-quadrant stamp grid poster",
    tilt: 5,
    src: svgCard(`
      <rect width="200" height="260" fill="#f3f0e8"/>
      <rect x="14" y="14" width="82" height="106" fill="#4b3fa8"/>
      <rect x="104" y="14" width="82" height="106" fill="#e8842f"/>
      <rect x="14" y="128" width="82" height="106" fill="#3fa84f"/>
      <rect x="104" y="128" width="82" height="106" fill="#b9b9b9"/>
    `),
  },
  {
    id: "worldwide",
    alt: "Sky blue poster with diagonal red text",
    tilt: -4,
    src: svgCard(`
      <rect width="200" height="260" fill="#3fb6e0"/>
      <rect width="200" height="90" fill="#e8b93f"/>
      <text x="20" y="170" font-family="Arial, sans-serif" font-size="26" font-weight="800" fill="#d8402f" transform="rotate(-8 100 150)">Already in Use!</text>
    `),
  },
  {
    id: "braille-stripes",
    alt: "Striped braille-pattern poster",
    tilt: 3,
    src: svgCard(`
      <rect width="200" height="260" fill="#f3ede0"/>
      <rect x="10" y="10" width="26" height="200" fill="#d8402f"/>
      <rect x="46" y="10" width="26" height="200" fill="#e8b93f"/>
      <rect x="82" y="10" width="26" height="200" fill="#7f8a94"/>
      <rect x="118" y="10" width="26" height="200" fill="#3f6fb0"/>
      <rect x="154" y="10" width="26" height="200" fill="#3fa84f"/>
    `),
  },
  {
    id: "grayscale-grid",
    alt: "Grayscale checkerboard poster",
    tilt: -5,
    src: svgCard(`
      <rect width="200" height="260" fill="#c9c9c9"/>
      <rect x="10" y="10" width="86" height="60" fill="#3a3a3a"/>
      <rect x="104" y="10" width="86" height="60" fill="#8f8f8f"/>
      <rect x="10" y="78" width="86" height="60" fill="#8f8f8f"/>
      <rect x="104" y="78" width="86" height="60" fill="#2a2a2a"/>
      <rect x="10" y="146" width="180" height="104" fill="#5a5a5a"/>
    `),
  },
  {
    id: "orange-duotone",
    alt: "Orange duotone architectural poster",
    tilt: 6,
    src: svgCard(`
      <rect width="200" height="260" fill="#d8501f"/>
      <rect x="0" y="120" width="200" height="140" fill="#8a2e10"/>
      <rect x="20" y="60" width="60" height="140" fill="#f0a06a"/>
    `),
  },
];

const RotatingImageOrbit = forwardRef<HTMLDivElement, RotatingImageOrbitProps>(
  (
    {
      images = DEFAULT_IMAGES,
      centerLine1 = "The Universal",
      centerLine2 = "Font.",
      duration = 40,
      className = "",
    },
    ref,
  ) => {
    // Unique per-instance keyframe names so multiple orbits on one page don't collide.
    const uid = useId().replace(/:/g, "");
    const ringAnim = `orbit-ring-${uid}`;
    const counterAnim = `orbit-counter-${uid}`;
    const count = images.length;

    return (
      <section
        ref={ref}
        className={`orbit-root relative mx-auto flex aspect-square w-full max-w-[720px] items-center justify-center bg-black ${className}`}
      >
        {/* Two linear, same-duration keyframe animations running in opposite directions
            cancel each other out on the card's own axis: the ring's rotation carries each
            card's position clockwise around the circle, and the counter-spin on the inner
            wrapper removes that same rotation from the artwork so it stays upright.
            Both are CSS time-based, so they never drift out of sync the way two
            independently-stepped JS loops eventually would. */}
        <style>{`
          @keyframes ${ringAnim} {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes ${counterAnim} {
            from { transform: rotate(0deg); }
            to { transform: rotate(-360deg); }
          }
          .orbit-ring-${uid} {
            animation: ${ringAnim} ${duration}s linear infinite;
          }
          .orbit-counter-${uid} {
            animation: ${counterAnim} ${duration}s linear infinite;
          }
          .orbit-root:hover .orbit-ring-${uid},
          .orbit-root:hover .orbit-counter-${uid} {
            animation-play-state: paused;
          }
          @media (prefers-reduced-motion: reduce) {
            .orbit-ring-${uid},
            .orbit-counter-${uid} {
              animation: none;
            }
          }
        `}</style>

        <div className={`orbit-ring-${uid} absolute inset-0`}>
          {images.map((img, i) => {
            const angle = (360 / count) * i;
            const tilt = img.tilt ?? 0;
            return (
              <div
                key={img.id}
                className="absolute left-1/2 top-1/2"
                style={{
                  transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(clamp(-260px, -34vw, -150px)) rotate(${-angle}deg)`,
                }}
              >
                <div className={`orbit-counter-${uid}`}>
                  <div
                    className="w-[clamp(90px,12vw,150px)] overflow-hidden rounded-[2px] shadow-[0_12px_30px_rgba(0,0,0,0.55)]"
                    style={{ transform: `rotate(${tilt}deg)` }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.src}
                      alt={img.alt}
                      className="block h-auto w-full"
                      draggable={false}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Center label sits outside the ring entirely, so it never inherits the spin. */}
        <div className="pointer-events-none relative z-10 text-center font-sans text-[clamp(28px,5vw,56px)] font-medium leading-[1.05] text-white">
          <div>{centerLine1}</div>
          <div>{centerLine2}</div>
        </div>
      </section>
    );
  },
);

RotatingImageOrbit.displayName = "RotatingImageOrbit";

export default RotatingImageOrbit;
