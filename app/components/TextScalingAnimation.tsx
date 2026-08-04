'use client';
import React from 'react'
import TextScale from './TextScale'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/all';
import { Plus } from 'lucide-react';

gsap.registerPlugin(useGSAP, ScrollTrigger);

const TextScalingAnimation = () => {
    useGSAP(() => {
        const containers =
          document.querySelectorAll<HTMLElement>("[data-container]");

        containers.forEach((container, index) => {
            const targetScale = 1 - index * 0.125;

            ScrollTrigger.create({
                trigger: container,
                start: "top center",
                end: "bottom top",
                scrub: true,

                onUpdate: (self) => {
                    const progress = self.progress;
                    const scaleFactor = 1 - (1 - targetScale) * progress * 1.6;
                    gsap.to(container, {
                        scale: scaleFactor,
                        transformOrigin: "50% 50%",
                    });
                },
            })
        })
    })
  return (
    <div className="mt-[50svh}">
      <section className="relative  h-[125svh]">
        {[...Array(7)].map((_, index) => (
          <TextScale key={index} />
        ))}
        <div className="absolute  top-1/2 left-1/2 z-10 flex size-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center">
          <a href="/signin">
            <Plus className='w-20 text-black h-20 stroke-[0.4]'/>
          </a>{" "}
        </div>{" "}
      </section>
    </div>
  );
}

export default TextScalingAnimation