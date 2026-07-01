"use client";

import React, { useState } from "react";

type Cell = {
  x: number;
  y: number;
  active: boolean;
};

const COLS = 12;
const ROWS = 6;
const RADIUS = 1;

const Footer = () => {
  const [cells, setCells] = useState<Cell[]>(
    Array.from({ length: COLS * ROWS }, (_, i) => ({
      x: i % COLS,
      y: Math.floor(i / COLS),
      active: false,
    })),
  );

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();

    const cellW = rect.width / COLS;
    const cellH = rect.height / ROWS;

    const cx = Math.floor((e.clientX - rect.left) / cellW);
    const cy = Math.floor((e.clientY - rect.top) / cellH);

    setCells((prev) =>
      prev.map((c) => {
        const dx = Math.abs(c.x - cx);
        const dy = Math.abs(c.y - cy);

        return {
          ...c,
          active: dx <= RADIUS && dy <= RADIUS,
        };
      }),
    );
  };

  return (
    <footer className="relative w-full overflow-hidden rounded-b-3xl px-8 pt-8 text-white">
      <div
        onMouseMove={handleMove}
        className="absolute inset-0 z-0 grid grid-cols-12 opacity-20"
      >
        {cells.map((c, i) => (
          <div
            key={i}
            className={[
              "border border-white/5 transition-colors duration-200",
              c.active ? "bg-white/10 border-white/30" : "",
            ].join(" ")}
          />
        ))}
      </div>
      <div className="relative z-10 grid w-full grid-cols-12 gap-10">
        {/* Explore */}
        <div className="col-span-12 sm:col-span-6 lg:col-span-2">
          <h1 className="mono text-sm tracking-tight text-white/50">Explore</h1>

          <div className="mt-2 flex flex-col mono tracking-tight gap-1 text-sm uppercase">
            <a
              href="#"
              className="tracking-tight transition hover:text-white/70"
            >
              Knowledge center
            </a>
            <a
              href="#"
              className="tracking-tight transition hover:text-white/70"
            >
              Enterprise
            </a>
            <a
              href="#"
              className="tracking-tight transition hover:text-white/70"
            >
              Pricing
            </a>
            <a
              href="#"
              className="tracking-tight transition hover:text-white/70"
            >
              Help
            </a>
            <a
              href="#"
              className="tracking-tight transition hover:text-white/70"
            >
              FAQ
            </a>
          </div>
        </div>

        {/* Follow */}
        <div className="col-span-12 sm:col-span-6 lg:col-span-2">
          <h1 className="mono text-sm tracking-tight text-white/50">
            Follow us
          </h1>

          <div className="mt-2 flex mono tracking-tight flex-col gap-1 text-sm uppercase">
            <a
              href="https://www.instagram.com/swiped.ai?igsh=MXRlamY1MHE1ZmxmNA%3D%3D&utm_source=qr"
              target="_blank"
              rel="noopener noreferrer"
              className="tracking-tight transition hover:text-white/70"
            >
              Instagram
            </a>
            <a
              href="https://youtube.com/@swiped-h2u?si=lfJd-iQSIMv0an7X"
              target="_blank"
              rel="noopener noreferrer"
              className="tracking-tight transition hover:text-white/70"
            >
              YouTube
            </a>
            <a
              href="https://discord.gg/xexnRhqBP"
              target="_blank"
              rel="noopener noreferrer"
              className="tracking-tight  transition hover:text-white/70"
            >
              Discord
            </a>
            <a
              href="#"
              className="tracking-tight hidden transition hover:text-white/70"
            >
              X
            </a>
          </div>
        </div>

        {/* Company */}
        <div className="col-span-12 sm:col-span-6 lg:col-span-2">
          <h1 className="mono text-sm tracking-tight text-white/50">Company</h1>

          <div className="mt-2 flex mono tracking-tight flex-col gap-1 text-sm uppercase">
            <a
              href="https://maize-vault-44c.notion.site/About-Swiped-37be79c73b2580749f62d30aa1955d84?source=copy_link"
              target="_blank"
              rel="noopener noreferrer"
              className="tracking-tight transition hover:text-white/70"
            >
              About
            </a>

            <a
              href="https://maize-vault-44c.notion.site/Swiped-Trust-Center-1620bb4e3ce549ddba8330935878d23d?source=copy_link"
              target="_blank"
              rel="noopener noreferrer"
              className="tracking-tight transition hover:text-white/70"
            >
              Trust
            </a>

            <a
              href="https://maize-vault-44c.notion.site/Swiped-Terms-of-Service-fce1fe0dccfc4fe0a05ad64f7363266e?source=copy_link"
              target="_blank"
              rel="noopener noreferrer"
              className="tracking-tight transition hover:text-white/70"
            >
              Terms
            </a>

            <a
              href="https://maize-vault-44c.notion.site/Swiped-Privacy-Policy-5a5e723ba16e4f44af9c888898f7746e?source=copy_link"
              target="_blank"
              rel="noopener noreferrer"
              className="tracking-tight transition hover:text-white/70"
            >
              Privacy
            </a>
          </div>
        </div>

        {/* Contact */}
        <div className="col-span-12 sm:col-span-6 lg:col-span-2">
          <h1 className="mono text-sm tracking-tight text-white/50">
            Contact Us
          </h1>

          <div className="mt-2 mono tracking-tight flex flex-col gap-1 text-sm uppercase">
            <a
              href="mailto:hello@swipes.com"
              className="tracking-tight transition hover:text-white/70"
            >
              hello@swipes.com
            </a>

            <a
              href="#"
              className="tracking-tight transition hover:text-white/70"
            >
              Support center
            </a>
          </div>
        </div>

        {/* Description */}
        <div className="col-span-12 lg:col-span-4">
          <p className="mono text-xs uppercase tracking-wide text-white/80">
            Reflow transforms ideas into visuals at the speed of thought. Built
            for creators, designers, and storytellers, it blends AI generation
            with human direction to make creative work feel fluid, expressive,
            and alive.
          </p>

          <div className="mt-4 flex flex-col uppercase">
            <p className="mono text-xs text-white/40">Reflow Inc</p>
            <p className="mono text-xs text-white/40">
              ©2026 All Rights Reserved
            </p>
          </div>

          <div className="mt-4 flex gap-6 uppercase">
            <a
              href="https://maize-vault-44c.notion.site/Swiped-Terms-of-Service-fce1fe0dccfc4fe0a05ad64f7363266e?source=copy_link"
              target="_blank"
              rel="noopener noreferrer"
              className="mono text-xs text-white/40 transition hover:text-white/70"
            >
              Terms & Conditions
            </a>

            <a
              href="https://maize-vault-44c.notion.site/Swiped-Privacy-Policy-5a5e723ba16e4f44af9c888898f7746e?source=copy_link"
              target="_blank"
              rel="noopener noreferrer"
              className="mono text-xs text-white/40 transition hover:text-white/70"
            >
              Privacy Policy
            </a>
          </div>
        </div>
      </div>

      {/* Footer graphic */}
      <div className="-mt-16 w-full lg:-mt-1">
        <img
          src="/images/Reflow.svg"
          alt="Reflow footer graphic"
          className="pointer-events-none w-full select-none object-contain"
          draggable={false}
        />
      </div>
      <p className="text-white mix-blend-difference  justify-center mono items-center flex text-xs mb-2 -mt-10">
        CURRENTLY IN BETA
      </p>
    </footer>
  );
};

export default Footer;
