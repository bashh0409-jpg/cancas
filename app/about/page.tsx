//
//  page.tsx
//
//
//  Created by Wandile Langa on 2026/08/16.
//

"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, X, ArrowUpRight } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const menuItems = ["About", "Pricing", "Legal", "Support", "Sign in"];

const process = [
  {
    n: "01",
    title: "Generate",
    copy: "Prompt for images, video, and variations without leaving the canvas. Every generation lands as an object you can move, resize, and connect to the rest of your board.",
  },
  {
    n: "02",
    title: "Organize",
    copy: "Group assets by project, mood, or version. Reflow keeps the history of every generation so you can branch from any point instead of starting over.",
  },
  {
    n: "03",
    title: "Refine",
    copy: "Layer edits, mix references, and hand-finish the details AI can't. The canvas holds the full arc from first draft to shipped asset.",
  },
];

const features = [
  {
    title: "Infinite canvas",
    copy: "Arrange ideas spatially instead of scrolling through a feed of outputs.",
  },
  {
    title: "Version branching",
    copy: "Every generation keeps its lineage, so you can explore without losing the thread.",
  },
  {
    title: "Human in the loop",
    copy: "AI proposes, you decide. Nothing ships without a hand on it.",
  },
  {
    title: "Team boards",
    copy: "Share a canvas the way you'd share a doc — same project, same context.",
  },
];

export default function Page() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const menuRef = useRef<HTMLElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

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
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const reveals = gsap.utils.toArray<HTMLElement>(".reveal");
      reveals.forEach((el) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 24 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: {
              trigger: el,
              start: "top 85%",
              once: true,
            },
          },
        );
      });
    }, rootRef);

    return () => ctx.revert();
  }, []);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
  };

  return (
    <div
      ref={rootRef}
      className="relative scroll-smooth min-h-screen bg-[#101010] text-white"
    >
      {/* Full-screen menu */}
      <aside
        ref={menuRef}
        className="fixed inset-0 z-[100] h-screen w-screen bg-white text-black"
        style={{ clipPath: "inset(0 0 0 100%)" }}
      >
        <div className="flex h-full flex-col p-4">
          <div className="flex items-center justify-between">
            <a
              className="flex items-center gap-1 text-black mix-blend-difference"
              href="/app"
            >
              <h1 className="font-mono text-white text-sm font-medium uppercase tracking-tight">
                Join
              </h1>
              <img src="/images/Re.svg" alt="" className="h-6 w-6" />
            </a>
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              className="flex items-center justify-center gap-1 rounded font-mono text-sm font-medium uppercase tracking-tight transition-colors"
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
              Close
            </button>
          </div>

          <nav className="mt-20 flex flex-col">
            {menuItems.map((item) => (
              <a
                key={item}
                href={
                  item === "Sign in"
                    ? "/signin"
                    : item === "About"
                      ? "/about"
                      : item === "Support"
                        ? "/support"
                        : item === "Legal"
                          ? "/legal"
                          : item === "Pricing"
                            ? "/pricing"
                            : "#"
                }
                className="group flex items-center justify-between border-b border-black/10 py-5 font-mono text-2xl uppercase tracking-tight transition-colors hover:bg-black/[0.03] md:text-4xl"
              >
                <span>{item}</span>
                <ArrowUpRight className="h-5 w-5 opacity-0 transition-opacity group-hover:opacity-100" />
              </a>
            ))}
          </nav>

          <div className="mt-auto pt-8 font-mono text-[11px] uppercase tracking-tight text-black/40">
            © {new Date().getFullYear()} Reflow
          </div>
        </div>
      </aside>

      {/* Header */}
      <header className="fixed z-30 flex w-full items-center justify-between p-4 font-mono text-sm font-medium uppercase mix-blend-difference">
        <a
          className="flex items-center gap-1 text-black mix-blend-difference"
          href="https://swipes.site/"
        >
          <h1 className="font-mono text-sm font-medium uppercase tracking-tight">
            Join
          </h1>
          <img src="/images/Re.svg" alt="" className="h-6 w-6" />
        </a>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="flex items-center gap-2 uppercase md:hidden"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            <Plus className="h-4 w-4" />
            Menu
          </button>

          <nav className="hidden gap-4 md:flex">
            <a
              href="/about"
              className="rounded-full p-1 px-2 transition-colors hover:bg-[#f8ff9a] hover:text-black"
            >
              About
            </a>
            <a
              href="/pricing"
              className="rounded-full p-1 px-2 transition-colors hover:bg-[#f8ff9a] hover:text-black"
            >
              Pricing
            </a>
            <a
              href="/legal"
              className="rounded-full p-1 px-2 transition-colors hover:bg-[#f8ff9a] hover:text-black"
            >
              Legal
            </a>
            <a
              href="/faq"
              className="rounded-full p-1 px-2 transition-colors hover:bg-[#f8ff9a] hover:text-black"
            >
              Faq
            </a>
            <a
              href="/support"
              className="rounded-full p-1 px-2 transition-colors hover:bg-[#f8ff9a] hover:text-black"
            >
              Support
            </a>
            <a
              href="/signin"
              className="rounded-full p-1 px-2 transition-colors hover:bg-[#f8ff9a] hover:text-black"
            >
              Sign in
            </a>
          </nav>
        </div>
      </header>

      {/* Hero / dark grid */}
      <section
        className="relative min-h-screen bg-repeat-x bg-[length:32px_100%] sm:bg-[length:40px_100%] lg:bg-[length:30px_100%] xl:bg-[length:25px_100%]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(160,160,160,0.1) 0px, rgba(160,160,160,0.1) 1px, transparent 1px, transparent 100%)",
        }}
      >
        <div className="min-h-screen w-full p-4 pt-24 font-mono tracking-tight md:pt-32">
          <div className="flex flex-col gap-10 md:flex-row md:gap-16">
            <div className="w-full md:w-1/3">
              <h1 className="mb-1 text-xl uppercase">Welcome to reflow</h1>
              <h2 className="text-xs uppercase text-white/50">
                Learn about reflow and get started
              </h2>
            </div>

            <div className="flex w-full flex-col md:w-2/3">
              <div
                className="mb-4 aspect-video w-full border border-white/10 bg-[#f8ff9a]"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(45deg, rgba(0,0,0,0.06) 0, rgba(0,0,0,0.06) 1px, transparent 1px, transparent 10px)",
                }}
                aria-hidden
              />
              <p className="text-sm leading-relaxed text-white/80">
                Reflow is an AI-powered creative workspace designed to bring
                artificial intelligence and human creativity together in one
                visual canvas. It allows users to generate, organize, and refine
                creative assets such as images and videos while giving them the
                freedom to arrange ideas visually and develop them into complete
                projects. Rather than treating AI as a replacement for the
                creative process, Reflow is designed to make AI a flexible part
                of the workflow, giving creators more control over how ideas are
                explored, developed, and brought to life.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="border-t border-white/10 px-4 py-20 font-mono tracking-tight md:py-28">
        <div className="reveal mb-14 flex items-end justify-between">
          <h2 className="text-xl uppercase">How it works</h2>
          <span className="text-xs uppercase text-white/40">
            One canvas, three moves
          </span>
        </div>

        <div className="grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-8">
          {process.map((step) => (
            <div key={step.n} className="reveal border-t border-white/10 pt-5">
              <span className="text-xs text-[#f8ff9a]">{step.n}</span>
              <h3 className="mt-3 text-lg uppercase">{step.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-white/60">
                {step.copy}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-white/10 px-4 py-20 font-mono tracking-tight md:py-28">
        <h2 className="reveal mb-14 text-xl uppercase">Built for the canvas</h2>

        <div className="grid grid-cols-1 gap-px overflow-hidden rounded border border-white/10 bg-white/10 sm:grid-cols-2">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="reveal bg-[#101010] p-6 transition-colors hover:bg-white/[0.03]"
            >
              <h3 className="text-sm uppercase">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/60">
                {feature.copy}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-white/10 px-4 py-20 font-mono tracking-tight md:py-28">
        <div className="reveal mx-auto max-w-xl text-center">
          <h2 className="text-xl uppercase">Get early access</h2>
          <p className="mt-3 text-sm text-white/60">
            We're rolling out invites in small batches. Leave your email and
            we'll let you know when it's your turn.
          </p>

          {submitted ? (
            <p className="mt-8 text-sm uppercase text-[#f8ff9a]">
              You're on the list.
            </p>
          ) : (
            <form
              onSubmit={handleSubscribe}
              className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center"
            >
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@studio.com"
                className="w-full rounded-full border border-white/15 bg-transparent px-4 py-2 text-sm text-white outline-none placeholder:text-white/30 focus:border-[#f8ff9a] sm:w-72"
              />
              <button
                type="submit"
                className="rounded-full bg-[#f8ff9a] px-5 py-2 text-sm uppercase text-black transition-opacity hover:opacity-80"
              >
                Join the waitlist
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 px-4 py-10 font-mono text-xs uppercase tracking-tight text-white/50">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <a
            className="flex items-center gap-1 text-white"
            href="https://swipes.site/"
          >
            <span>Reflow</span>
            <img src="/images/Re.svg" alt="" className="h-5 w-5" />
          </a>

          <nav className="flex flex-wrap gap-4">
            <a href="/about" className="hover:text-white">
              About
            </a>
            <a href="/pricing" className="hover:text-white">
              Pricing
            </a>
            <a href="/legal" className="hover:text-white">
              Legal
            </a>
            <a href="/faq" className="hover:text-white">
              Faq
            </a>
            <a href="/support" className="hover:text-white">
              Support
            </a>
          </nav>

          <span>© {new Date().getFullYear()} Reflow. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
