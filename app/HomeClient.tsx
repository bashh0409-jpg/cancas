"use client";

import { useEffect, useRef, useState } from "react";
import { CircleUserRound, Plus, X } from "lucide-react";
import { gsap } from "gsap";
import type { Metadata } from "next";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { User } from "@supabase/supabase-js";
import MouseImageTrail from "./components/MouseImageTrail";
import ReflowDemoModal from "./components/ReflowDemoModal";


export const metadata: Metadata = {
  title: "Reflow",
  description:
    "Reflow is an AI-powered creative canvas for turning ideas into images, videos, and visual concepts.",
  alternates: {
    canonical: "/",
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Reflow",
  applicationCategory: "DesignApplication",
  operatingSystem: "Web",
  url: "https://swipes.site",
  description:
    "Reflow is an AI-powered creative canvas for turning ideas into images, videos, and visual concepts.",
  image: "https://swipes.site/og-image.png",
};

gsap.registerPlugin(ScrollTrigger);
import Faq from "./components/Faqn";
//import Pricing from "./components/Pricing";
import Hero from "./components/HeroN";
import BackgroundAudio from "./components/BackgroundAudio";
import Swirl from "./components/Swirl";
import BounceInText from "./components/BounceInText";
import ReflowIntro from "./components/ReflowIntro";
import { TrustedBy } from "./components/work/TrustedBy";
import { MWG_022_TypographyReveal } from "./components/mwg_022/MWG_022_TypographyReveal";

interface HomeClientProps {
  user: User | null;
}

export default function HomeClient({ user }: HomeClientProps) {

  <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{
      __html: JSON.stringify(structuredData),
    }}
  />;
  const [menuOpen, setMenuOpen] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const menuRef = useRef<HTMLElement>(null);

  // ── Auth-aware nav destination + label ──────────────────────────────
  const accountHref = user ? "/work" : "/signin";
  const accountLabel = user ? "Workspace" : "Sign in";

  const menuItems = [
    { label: "About", href: "/about" },
    { label: "Pricing", href: "/pricing" },
    { label: "Legal", href: "/legal" },
    { label: "Support", href: "/support" },
    { label: accountLabel, href: accountHref },
  ];

  useEffect(() => {
    const menu = menuRef.current;

    if (!menu) return;

    gsap.to(menu, {
      clipPath: menuOpen ? "inset(0 0% 0 0%)" : "inset(0 0% 0 100%)",
      duration: menuOpen ? 0.7 : 0.55,
      ease: "power4.inOut",
    });
  }, [menuOpen]);

  useEffect(() => {
    const onResize = () => ScrollTrigger.refresh();
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <main className="relative scroll-smooth scrollbar-hidden min-h-screen bg-[#101010] text-white">
      {/* Full-screen menu */}
      <aside
        ref={menuRef}
        className="fixed inset-0 z-[100] h-screen w-screen bg-white text-black"
        style={{
          clipPath: "inset(0 0 0 100%)",
        }}
      >
        <div className="flex h-full scrollbar-hidden flex-col p-4">
          {/* Menu header */}
          <div className="flex hidde items-center justify-between">
            <a
              className="flex text-blac mix-blend-difference  items-center  gap-1 "
              href="https://swipes.site/"
            >
              <h1 className="font-mono tracking-tight uppercase font-medium text-sm">
                Join
              </h1>
              <img
                src="/images/Re.svg"
                alt=""
                className="h-6 text-black mix-blend-difference w-6"
              />{" "}
            </a>
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              className="flex tracking-tight  font-medium text-sm font-mono uppercase items-center justify-center rounded transition-colors"
              aria-label="Close menu"
            >
              <X className="h-4 hidden w-4" />
              close
            </button>
          </div>

          {/* Navigation */}
          <nav className="mt-20 flex flex-col">
            {menuItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="group flex items-center justify-between border-b border-black/10 py-5 font-mono text-2xl uppercase tracking-tight transition-colors hover:bg-black/[0.03] md:text-4xl"
              >
                <span>{item.label}</span>
              </a>
            ))}
          </nav>
        </div>
      </aside>
      {/* Main page */}
      <div className="relative  scrollbar-hidden z-20 flex min-h-screen flex-col">
        <header className="fixed z-30 flex w-full items-center justify-between p-4 font-mono text-sm font-medium uppercase mix-blend-difference">
          <a
            className="flex text-blac mix-blend-difference  items-center  gap-1 "
            href="https://swipes.site/"
          >
            <h1 className="font-mono tracking-tight uppercase font-medium text-sm">
              Join
            </h1>
            <img
              src="/images/Re.svg"
              alt=""
              className="h-6 text-black mix-blend-difference w-6"
            />{" "}
          </a>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="flex items-center gap-2 uppercase md:hidden"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
            >
              <Plus className="h-4 hidden w-4" />
              Menu
            </button>

            <nav className="hidden gap-4 md:flex">
              <a
                href="/about"
                className="p-1 px-2 rounded-full transition-colors hover:bg-[#f8ff9a] hover:text-black"
              >
                About
              </a>{" "}
              <a
                href="/pricing"
                className="p-1 px-2 rounded-full transition-colors hover:bg-[#f8ff9a] hover:text-black"
              >
                Pricing
              </a>
              <a
                href="/legal"
                className="p-1 px-2 rounded-full transition-colors hover:bg-[#f8ff9a] hover:text-black"
              >
                Legal
              </a>
              <a
                href="/faq"
                className="p-1 px-2 rounded-full transition-colors hover:bg-[#f8ff9a] hover:text-black"
              >
                Faq
              </a>
              <a
                href="/support"
                className="p-1 px-2 rounded-full transition-colors hover:bg-[#f8ff9a] hover:text-black"
              >
                Support
              </a>
              <a
                href={accountHref}
                className="p-1 px-2 gap-2 rounded-full flex items-center transition-colors hover:bg-[#f8ff9a] hover:text-black"
              >
                {user && (
                  <span>
                    <CircleUserRound className="w-4 h-4" />{" "}
                  </span>
                )}
                {accountLabel}
              </a>
            </nav>
          </div>
        </header>

        {/* Dark grid */}
        <div
          className="relative flex justify-center h-fit bg-repeat-x bg-[length:32px_100%] sm:bg-[length:40px_100%] lg:bg-[length:30px_100%] xl:bg-[length:25px_100%]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(160,160,160,0.1) 0px, rgba(160,160,160,0.1) 1px, transparent 1px, transparent 100%)",
          }}
        >
          <Hero user={user} />
        </div>
        {/* White grid */}
        <div
          className="relative h-screen bg-white bg-repeat-x bg-[length:32px_100%] sm:bg-[length:40px_100%] lg:bg-[length:30px_100%] xl:bg-[length:25px_100%]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(80,80,80,0.1) 0px, rgba(80,80,80,0.1) 1px, transparent 1px, transparent 100%)",
          }}
        >
          {/*  <TextScalingAnimation /> */}
        </div>
        {/* Dark grid */}
        <div
          className="relative flex h-screen items-center justify-center bg-repeat-x bg-[length:32px_100%] sm:bg-[length:40px_100%] lg:bg-[length:30px_100%] xl:bg-[length:25px_100%]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(160,160,160,0.1) 0px, rgba(160,160,160,0.1) 1px, transparent 1px, transparent 100%)",
          }}
        >
          <div className="mx-auto my-auto px-4 text-center tracking-tight text-white/80">
            <p className="font-mono text-sm uppercase">
              Brands I&apos;d love to work with in the future:
            </p>

            <div className="">
              <TrustedBy />
            </div>
          </div>
        </div>
        {/* White grid */}
        <div
          className="relative w-full bg-white bg-repeat-x bg-[length:32px_100%] sm:bg-[length:40px_100%] lg:bg-[length:30px_100%] xl:bg-[length:25px_100%]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(80,80,80,0.1) 0px, rgba(80,80,80,0.1) 1px, transparent 1px, transparent 100%)",
          }}
        >
          <MWG_022_TypographyReveal
            textColor="#000"
            borderColor="rgb(73, 73, 73)"
          />
        </div>
        {/* Dark grid */}
        <div
          className="relative  h- justify-center flex items-center bg-repeat-x bg-[length:32px_100%] sm:bg-[length:40px_100%] lg:bg-[length:30px_100%] xl:bg-[length:25px_100%]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(160,160,160,0.1) 0px, rgba(160,160,160,0.1) 1px, transparent 1px, transparent 100%)",
          }}
        >
          <ReflowIntro />
        </div>
        
        {/* White grid */}
        {/* White grid */}
        <div
          className="relative h-screen bg-white bg-repeat-x"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(80,80,80,0.1) 0px, rgba(80,80,80,0.1) 1px, transparent 1px, transparent 100%)",
            backgroundSize: "25px 100%",
          }}
        ></div>
        {/* Dark grid */}
        <div
          className="relative min-h-screen opacity bg-repeat-x bg-[length:32px_100%] sm:bg-[length:40px_100%] lg:bg-[length:30px] xl:bg-[length:25px]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(160,160,160,0.1) 0px, rgba(160,160,160,0.1) 1px, transparent 1px, transparent 100%)",
          }}
        >
          <MouseImageTrail />
        </div>

        {/* White grid */}
        <div
          className="relative h-screen flex flex-col justify-center items-center bg-white bg-repeat-x bg-[length:32px_100%] sm:bg-[length:40px_100%] lg:bg-[length:30px_100%] xl:bg-[length:25px_100%]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(80,80,80,0.1) 0px, rgba(80,80,80,0.1) 1px, transparent 1px, transparent 100%)",
          }}
        >
          {/*  <Pricing />*/}{" "}
          <img
            src="/images/Re.svg"
            alt=""
            className="h-6 w-6 text-black mix-blend-difference"
          />{" "}
          <button
            type="button"
            onClick={() => setDemoOpen(true)}
            className="w-fit  p-0.5 h-fit cursor-pointer flex items-center gap-3 font-mono mix-blend-difference uppercase"
          >
            <span className="text-2xl">[</span>
            Watch reflow the demo
            <span className="text-2xl">]</span>
          </button>
        </div>

        {/* Dark grid */}
        <div
          className="relative p-2 flex flex-col z-500 md:p-8  py-18 h-fit opacity bg-repeat-x bg-[length:32px_100%] sm:bg-[length:40px_100%] lg:bg-[length:30px_100%] xl:bg-[length:25px_100%]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(160,160,160,0.1) 0px, rgba(160,160,160,0.1) 1px, transparent 1px, transparent 100%)",
          }}
        >
          <div className="h-15"></div>
          <Faq />
          <div className="h-15"></div>
        </div>

        {/* White grid */}
        <div
          className="relative h-fit bg-white bg-repeat-x"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(80,80,80,0.1) 0px, rgba(80,80,80,0.1) 1px, transparent 1px, transparent 100%)",
            backgroundSize: "25px 100%",
          }}
        >
          <BounceInText text="So, ready to create with " />
        </div>

        {/* Dark grid */}
        <div
          className="relative p-2 flex flex-col z-500 md:p-8  py-18 h-fit opacity bg-repeat-x bg-[length:32px_100%] sm:bg-[length:40px_100%] lg:bg-[length:30px_100%] xl:bg-[length:25px_100%]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(160,160,160,0.1) 0px, rgba(160,160,160,0.1) 1px, transparent 1px, transparent 100%)",
          }}
        >
          <Swirl />
        </div>

        {/* White grid x FOOTER */}
        <div
          className="relative overflow-x-hidden flex flex-col h-screen items-center justify-center bg-white bg-repeat-x bg-[length:32px_100%] sm:bg-[length:40px_100%] lg:bg-[length:30px_100%] xl:bg-[length:25px_100%]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(80,80,80,0.1) 0px, rgba(80,80,80,0.1) 1px, transparent 1px, transparent 100%)",
          }}
        >
          {" "}
          <div className="flex gap-2 hidde flex-wrap justify-center items-center  md:gap-4">
            <a
              href="/about"
              className="bg-transparent items-center gap-2 font-mono tracking-tighter flex text-black text-sm font-medium px-4 py-2 rounded-md"
            >
              <Plus className="w-4 h-4" />
              ABOUT US
            </a>
            <a
              href="/pricing"
              className="bg-transparent items-center gap-2 font-mono tracking-tighter flex text-black text-sm font-medium px-4 py-2 rounded-md"
            >
              <Plus className="w-4 h-4" />
              PRICING
            </a>
            <a
              href="/legal"
              className="bg-transparent items-center gap-2 font-mono tracking-tighter flex text-black text-sm font-medium px-4 py-2 rounded-md"
            >
              <Plus className="w-4 h-4" />
              LEGAL
            </a>
            <a
              href="/faq"
              className="bg-transparent items-center gap-2 font-mono tracking-tighter flex text-black text-sm font-medium px-4 py-2 rounded-md"
            >
              <Plus className="w-4 h-4" />
              FAQ
            </a>
            <a
              href="/support"
              className="bg-transparent items-center gap-2 font-mono tracking-tighter flex text-black text-sm font-medium px-4 py-2 rounded-md"
            >
              <Plus className="w-4 h-4" />
              SUPPORT
            </a>
          </div>
          <div className="flex flex-col gap-2 mt-6 items-center justify-center">
            <p className="text-center  p-4 max-w-md text-black  font-mono tracking-tighter">
              Unlock the greater power of{" "}
              <span className="italic font-medium">AI</span> X{" "}
              <span className="italic font-medium">Human</span> intelligence
              with Reflow.
            </p>
            <div className="text-center md:hidden flex items-center justify-center w-full -ml-6 text-[140px] md:text-[250px] leading-none tracking-[-0.18em] font-medium font-mono whitespace-nowrap">
              <span className="mix-blend-difference">R</span>
              <span className="mix-blend-difference">ë</span>
              <span className="mix-blend-difference">f</span>
              <span className="mix-blend-difference">l</span>
              <span className="mix-blend-difference">o</span>
              <span className="mix-blend-difference">w</span>
            </div>
            <div className="text-center hidden md:flex text-[150px] md:text-[250px] leading-none tracking-[-0.18em] font-medium font-mono whitespace-nowrap">
              <span className="mix-blend-difference">R</span>
              <span className="mix-blend-difference">ë</span>
              <span className="mix-blend-difference">f</span>
              <span className="mix-blend-difference">l</span>
              <span className="mix-blend-difference">o</span>
              <span className="mix-blend-difference">w</span>
            </div>
            <p className="text-center w-full p-4 max-w-md text-black  font-mono tracking-tighter">
              The simplest way to bring <span className="italic ">AI</span> and
              creativity together.<span className="italic ">R</span>eflow
              combines powerful AI with{" "}
              <span className="italic ">human creativity</span> to redefine how
              we create.
            </p>{" "}
          </div>
          <div className="w-full flex   justify-between absolute bottom-4 left-0 ">
            <div className="flex   w-full  justify-between md:w-fit items-center ">
              {" "}
              <a
                href="/privacy-policy"
                className="bg-transparent  items-center gap-1 font-mono tracking-tighter flex text-black  font-medium px-4 py-2 rounded-md"
              >
                <Plus className="w-4 h-4" />
                PRIVACY POLICY
              </a>
              <a
                href="/terms-of-service"
                className="bg-transparent  items-center gap-1 font-mono tracking-tighter flex text-black  font-medium px-4 py-2 rounded-md"
              >
                <Plus className="w-4 h-4" />
                TERMS OF USE
              </a>{" "}
            </div>
            <div className="hidden md:flex w-full gap-2 uppercase flex-col md:flex-row justify-between md:w-fit items-center ">
              <p className="bg-transparent   items-center gap-2 font-mono tracking-tighter flex text-black  font-medium px-4 py-2 rounded-md">
                IP: Reflow LLC 2024
              </p>
              <p className="bg-transparent  items-center gap-2 font-mono tracking-tighter flex text-black  font-medium px-4 py-2 rounded-md">
                IN: 43091XXXXXX
              </p>{" "}
            </div>
            <div className="md:flex w-full gap-1 hidden justify-betwee md:w-fit items-center flex-wrap">
              <a
                href="https://discord.gg/vfstVqF3gk"
                className="bg-transparent items-center gap-2 font-mono tracking-tighter flex text-black  font-medium px-4 py-2 rounded-md"
              >
                <Plus className="w-4 h-4" />
                DISCORD
              </a>
              <a
                href="https://youtube.com/@reflowfyi?si=QCnvJcY09fYOThJi"
                className="bg-transparent items-center  gap-1 font-mono tracking-tighter flex text-black  font-medium px-4 py-2 rounded-md"
              >
                <Plus className="w-4 h-4" />
                YOUTUBE
              </a>
            </div>
          </div>
        </div>
      </div>{" "}
      <BackgroundAudio />
      {/* Reflow demo modal */}
      <ReflowDemoModal open={demoOpen} onClose={() => setDemoOpen(false)} />
    </main>
  );
}
