"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";

interface HoverAnimationOptions {
  colorDelay?: number;
  scaleDelay?: number;
  colorDuration?: number;
  scaleDuration?: number;
  hoverColor?: string;
  initialColor?: string;
}

export function useHoverAnimation(options: HoverAnimationOptions = {}) {
  const {
    colorDelay = 0.2,
    scaleDelay = 0,
    colorDuration = 0.3,
    scaleDuration = 0.2,
    hoverColor = "rgba(255, 255, 255, 0.2)",
    initialColor = "rgba(255, 255, 255, 0)",
  } = options;

  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const timeline = gsap.timeline({ paused: true });

    // Hover in animation
    timeline
      .to(
        element,
        {
          backgroundColor: hoverColor,
          duration: colorDuration,
          delay: colorDelay,
        },
        0,
      )
      .to(
        element,
        {
          scale: 1.02,
          duration: scaleDuration,
        },
        scaleDelay,
      );

    const handleMouseEnter = () => timeline.play();
    const handleMouseLeave = () => {
      timeline.reverse();
      // Reset to initial state after reverse completes
      gsap.to(element, {
        backgroundColor: initialColor,
        scale: 1,
        duration: 0.3,
      });
    };

    element.addEventListener("mouseenter", handleMouseEnter);
    element.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      element.removeEventListener("mouseenter", handleMouseEnter);
      element.removeEventListener("mouseleave", handleMouseLeave);
      timeline.kill();
    };
  }, [
    colorDelay,
    scaleDelay,
    colorDuration,
    scaleDuration,
    hoverColor,
    initialColor,
  ]);

  return elementRef;
}
