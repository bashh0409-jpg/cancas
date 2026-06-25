"use client";

import Link from "next/link";
import Image from "next/image";
import React, { useLayoutEffect, useRef, useState, useEffect } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import gsap from "gsap";

const NAV_LINKS = [
  {
    label: "ENTERPRISE",
    href: "/signin",
  },
  {
    label: "PRICING",
    href: "/signin",
  },
  {
    label: "HELP",
    href: "/signin",
  },
  {
    label: "FAQs",
    href: "/signin",
  },
];

const Navbar = () => {
  const router = useRouter();
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
        router.push("/home");
      } else {
        router.push("/signin");
      }
    } catch (error) {
      console.error("Error checking session:", error);
      router.push("/signin");
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
      <nav className="fixed top-0 left-0 z-50 flex w-full items-center justify-between px-4 py-4 md:px-6">
      <div className="flex items-baseline "> <Image
          src="/images/Re.svg"
          alt="Reflow logo"
          width={180}
          height={48}
          priority
          className="h-8 w-auto mix-blend-difference"
        />
        <span className="text-xs uppercase -mt-1 tracking-tight mono ml-2">beta</span></div> 

        {/* Desktop */}
        <div className="hidden bg-black p-2 rounded items-center gap-1 lg:flex">
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
        <div className="hidden items-center gap-1 lg:flex">
          <button
            onClick={handleStartProject}
            disabled={checkingSession}
            className="ml-2 flex cursor-pointer items-center gap-1 rounded bg-white px-2 py-1 text-xs tracking-tight text-black transition-opacity hover:opacity-90 disabled:opacity-70"
          >
            Start Now
            <ArrowUpRight className="h-4 w-4 rounded bg-black p-0.5 text-white" />
          </button>
        </div>

        {/* Mobile button */}
        <div className="flex gap-2 md:hidden">
          {" "}
          <button
            onClick={() => {
              handleStartProject();
              setOpen(false);
            }}
            disabled={checkingSession}
            className="flex w-fit cursor-pointer items-center gap-2 rounded bg-white px-4 py-2 text-sm text-black disabled:opacity-70"
          >
            Start Now
            <ArrowUpRight className="h-4 w-4 rounded bg-black p-0.5 text-white" />
          </button>{" "}
          <button
            onClick={() => setOpen((prev) => !prev)}
            className="grid h-9 w-9 place-items-center rounded bg-white lg:hidden"
            aria-label="Toggle Menu"
          >
            {open ? (
              <X className="h-5 w-5 text-black" />
            ) : (
              <Menu className="h-5 w-5 text-black" />
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
        <div className="flex h-full flex-col justify-between px-6 pt-28 pb-10">
          <div className="flex flex-col">
            {NAV_LINKS.map((item, index) => (
              <Link
                key={item.label}
                href={item.href}
                ref={(el) => {
                  if (el) linksRef.current[index] = el;
                }}
                onClick={() => setOpen(false)}
                className="border-b border-white/10 py-5 text-4xl tracking-tight"
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
