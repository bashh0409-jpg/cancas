"use client";

import React, { useCallback, useState } from "react";

type NavLink = {
  label: string;
  href: string;
};

type NavGroup = {
  title: string;
  links: NavLink[];
};

// NOTE: these three groups link out to Notion pages that mix "Swiped" and
// "Reflow" naming in their URLs/slugs. Left untouched since they're live
// links — worth auditing against whichever brand name is actually current.
const NAV_GROUPS: NavGroup[] = [
  {
    title: "Explore",
    links: [
      { label: "Knowledge center", href: "#" },
      { label: "Enterprise", href: "#" },
      { label: "Pricing", href: "#" },
      { label: "Help", href: "/support" },
      { label: "FAQ", href: "#" },
    ],
  },
  {
    title: "Company",
    links: [
      {
        label: "About",
        href: "https://maize-vault-44c.notion.site/About-Swiped-37be79c73b2580749f62d30aa1955d84?source=copy_link",
      },
      {
        label: "Trust center",
        href: "https://maize-vault-44c.notion.site/Swiped-Trust-Center-1620bb4e3ce549ddba8330935878d23d?source=copy_link",
      },
      {
        label: "Terms of service",
        href: "https://maize-vault-44c.notion.site/Swiped-Terms-of-Service-fce1fe0dccfc4fe0a05ad64f7363266e?source=copy_link",
      },
      {
        label: "Privacy policy",
        href: "https://maize-vault-44c.notion.site/Swiped-Privacy-Policy-5a5e723ba16e4f44af9c888898f7746e?source=copy_link",
      },
    ],
  },
  {
    title: "Legal",
    links: [
      {
        label: "Cookie policy",
        href: "https://app.notion.com/p/Reflow-Cookie-Policy-390e79c73b25803093a5c64819f5698b?source=copy_link",
      },
      {
        label: "Beta agreement",
        href: "https://app.notion.com/p/Reflow-Beta-Testing-Agreement-390e79c73b2580ca9ee8fd76f8274d24?source=copy_link",
      },
      {
        label: "Acceptable use",
        href: "https://app.notion.com/p/Reflow-Acceptable-Use-Policy-390e79c73b25804cae66dbb15c9dd216?source=copy_link",
      },
      {
        label: "AI usage policy",
        href: "https://app.notion.com/p/Reflow-AI-Usage-Policy-390e79c73b2580668ae4daab0c271fc2?source=copy_link",
      },
      {
        label: "IP notice",
        href: "https://app.notion.com/p/Reflow-Copyright-Intellectual-Property-Policy-390e79c73b25806cbc96f3313f7e90b6?source=copy_link",
      },
      {
        label: "Account deletion",
        href: "https://app.notion.com/p/Reflow-Account-Deletion-Data-Retention-Policy-390e79c73b2580098822c96914ae2418?source=copy_link",
      },
    ],
  },
];

const SOCIALS: NavLink[] = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/swiped.ai?igsh=MXRlamY1MHE1ZmxmNA%3D%3D&utm_source=qr",
  },
  {
    label: "YouTube",
    href: "https://youtube.com/@swiped-h2u?si=lfJd-iQSIMv0an7X",
  },
  { label: "Discord", href: "https://discord.gg/vfstVqF3gk" },
];

const linkClass =
  "mono text-xs uppercase tracking-tight text-white/55 transition-colors duration-150 hover:text-blue-900";

const Footer = () => {
  const [glow, setGlow] = useState({ x: 50, y: 0, active: false });

  const handleMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setGlow({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
      active: true,
    });
  }, []);

  const handleLeave = useCallback(() => {
    setGlow((g) => ({ ...g, active: false }));
  }, []);

  const spotlightMask = glow.active
    ? `radial-gradient(360px circle at ${glow.x}% ${glow.y}%, black 0%, transparent 75%)`
    : "radial-gradient(360px circle at 50% -10%, black 0%, transparent 75%)";

  return (
    <footer
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className="relative w-full overflow-hidden rounded-b-3xl bg-[#0B0B0D] px-6 pb-6 pt-16 text-white sm:px-10"
    >
      {/* Ambient dot grid, always faintly visible */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "radial-gradient(rgba(245,243,238,1) 1px, transparent 1px)",
          backgroundSize: "26px 26px",
        }}
      />
      {/* Cursor spotlight: brightens the same grid where the pointer is */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-300"
        style={{
          backgroundImage:
            "radial-gradient(rgba(253, 253, 253, 0.9) 1px, transparent 1px)",
          backgroundSize: "26px 26px",
          WebkitMaskImage: spotlightMask,
          maskImage: spotlightMask,
          opacity: glow.active ? 0.5 : 0,
        }}
      />

      <div className="relative z-10 grid w-full grid-cols-2 gap-10 sm:grid-cols-2 lg:grid-cols-12">
        {/* Brand */}
        {/* Brand */}
        <div className="col-span-2 sm:col-span-2 lg:col-span-4">
          <span className="mono text-sm uppercase tracking-tight text-white/50">
            Reflow
          </span>
          <p className="mono mt-3 md:max-w-sm text-xs uppercase leading-relaxed tracking-wide text-white/70">
            Reflow transforms ideas into visuals at the speed of thought. Built
            for creators, designers, and storytellers, it blends AI generation
            with human direction.
          </p>
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-1">
            {SOCIALS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
              >
                {s.label}
              </a>
            ))}
          </div>
          <a
            href="mailto:hello@swipes.com"
            className={`${linkClass} my-4 block w-fit`}
          >
            hello@swipes.com
          </a>
          <span className="mono text-white/70 t-4 text-xs uppercase tracking-tight">
            © 2026 Reflow Inc. All rights reserved.
          </span>
        </div>

        {/* Nav groups */}
        {NAV_GROUPS.map((group) => (
          <div key={group.title} className="lg:col-span-2">
            <h2 className="mono text-xs uppercase tracking-tight text-white/40">
              {group.title}
            </h2>
            <div className="mt-3 flex flex-col gap-2">
              {group.links.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target={link.href.startsWith("http") ? "_blank" : undefined}
                  rel={
                    link.href.startsWith("http")
                      ? "noopener noreferrer"
                      : undefined
                  }
                  className={linkClass}
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        ))}

        {/* Contact / support */}
        <div className="lg:col-span-2">
          <h2 className="mono text-xs uppercase tracking-tight text-white/40">
            Support
          </h2>
          <div className="mt-3 flex flex-col gap-2">
            <a href="/support" className={linkClass}>
              Support center
            </a>
            <a href="mailto:hello@swipes.com" className={linkClass}>
              Contact us
            </a>
          </div>
        </div>
      </div>

      {/* Wordmark */}
      <div className="relative z-10 mt-16 w-full select-none">
        <img
          src="/images/Reflow.svg"
          alt="Reflow"
          className="pointer-events-none w-full object-contain opacity-90"
          draggable={false}
        />
      </div>
    </footer>
  );
};

export default Footer;
