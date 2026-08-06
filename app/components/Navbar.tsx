"use client";

import Link from "next/link";
import Image from "next/image";
import React, { useLayoutEffect, useRef, useState} from "react";
import { ArrowUpRight, Equal, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import gsap from "gsap";
import { getAppUrl } from "@/lib/appUrl";

const NAV_LINKS = [
  {
    label: "ENTERPRISE",
    href: "#",
  },
  {
    label: "PRICING",
    href: "#",
  },
  {
    label: "HELP",
    href: "/support",
  },
  {
    label: "LEGAL",
    href: "/legal",
  },
  {
    label: "FAQs",
    href: "#",
  },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [checkingSession, setCheckingSession] = useState(false);

  const overlayRef = useRef<HTMLDivElement | null>(null);
  const linksRef = useRef<HTMLAnchorElement[]>([]);

  async function handleStartProject() {
    setCheckingSession(true);
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        window.location.href = getAppUrl("/work");
      } else {
        window.location.href = getAppUrl("/signin");
      }
    } catch (error) {
      console.error("Error checking session:", error);
      window.location.href = getAppUrl("/signin");
    } finally {
      setCheckingSession(false);
    }
  }
  useLayoutEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;

    if (open) {
      gsap.set(overlay, {
        pointerEvents: "auto",
      });

      gsap.fromTo(
        overlay,
        {
          clipPath: "inset(0 0 100% 0)",
        },
        {
          clipPath: "inset(0 0 0% 0)",
          duration: 0.9,
          ease: "power4.inOut",
        },
      );

      gsap.fromTo(
        linksRef.current,
        {
          y: 40,
          opacity: 0,
        },
        {
          y: 0,
          opacity: 1,
          stagger: 0.08,
          delay: 0.25,
          duration: 0.7,
          ease: "power3.out",
        },
      );
    } else {
      gsap.to(overlay, {
        clipPath: "inset(0 0 100% 0)",
        duration: 0.7,
        ease: "power4.inOut",
        onComplete: () => {
          gsap.set(overlay, {
            pointerEvents: "none",
          });
        },
      });
    }
  }, [open]);

  return (
    <>
      <nav className="fixed z-100 top-0 left-0 z-50 flex w-full bg-white/0 mix-blend-difference items-center justify-between px-4 py-4 md:px-6">
        <div className="flex items-baseline ">
          {" "}
          <Image
            src="/images/Reflow.svg"
            alt="Reflow logo"
            width={180}
            height={48}
            priority
            className="h-8 w-auto mix-blend-difference"
          />
          <span className="text-xs uppercase -mt-1 tracking-tight mono ml-2">
            beta
          </span>
        </div>

        {/* Desktop */}
        <div className="hidden mono p-2 rounded items-center gap-1">
          {NAV_LINKS.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex mono items-center gap-2 rounded px-2 text-xs tracking-tight text-white transition-opacity hover:opacity-70"
            >
              {item.label}
            </Link>
          ))}
        </div>
        <div className="hidden mix-blend-difference items-center gap-1 md:flex lg:flex">
          {NAV_LINKS.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex host-grotesk items-center gap-2 rounded px-2 text-xs tracking-tight text-white transition-opacity hover:opacity-70"
            >
              {item.label}
            </Link>
          ))}
          <button
            onClick={handleStartProject}
            disabled={checkingSession}
            className="ml-2 flex cursor-pointer items-center gap-1 rounded-xs bg-white px-1 uppercase mono py-1 text-xs tracking-tight text-black transition-opacity hover:opacity-90 disabled:opacity-70"
          >
            Start Now
            <ArrowUpRight className="h-4 w-4 rounded-xs bg-black p-0.5 text-white" />
          </button>
        </div>

        {/* Mobile button */}
        <div className="flex gap-2 md:hidden">
          {" "}
          <button
            onClick={handleStartProject}
            disabled={checkingSession}
            className="ml-2 h-8 flex cursor-pointer items-center gap-1 rounded-xs bg-white px-1.5 uppercase mono py-1.5 text-xs tracking-tight text-black transition-opacity hover:opacity-90 disabled:opacity-70"
          >
            Start Now
            <ArrowUpRight className="h-4 w-4 rounded-xs bg-black p-0.5 text-white" />
          </button>
          <button
            onClick={() => setOpen((prev) => !prev)}
            className="grid h-8 w-8 place-items-center rounded-xs bg-white lg:hidden"
            aria-label="Toggle Menu"
          >
            {open ? (
              <X className="h-5 w-5 text-black" />
            ) : (
              <Equal className="h-5 w-5 text-black" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile overlay */}
      <div
        ref={overlayRef}
        className="fixed inset-0 z-40 bg-black text-white lg:hidden"
        style={{
          clipPath: "inset(0 0 100% 0)",
          pointerEvents: "none",
        }}
      >
        <div className="flex h-full  lime flex-col justify-between px-6 pt-28 pb-10">
          <div className="flex flex-col">
            {NAV_LINKS.map((item, index) => (
              <Link
                key={item.label}
                href={item.href}
                ref={(el) => {
                  if (el) linksRef.current[index] = el;
                }}
                onClick={() => setOpen(false)}
                className=" py-5 mix-blend-difference  host-grotesk text-4xl tracking-tight"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;
