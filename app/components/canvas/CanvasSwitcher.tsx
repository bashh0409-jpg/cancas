"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Layers } from "lucide-react";

type Canvas = {
  id: string;
  name: string;
  slug: string;
};

type CanvasSwitcherVariant = "light" | "dark";

export function CanvasSwitcher({
  canvases = [],
  activeCanvasId,
  variant = "light",
}: {
  canvases?: Canvas[];
  activeCanvasId: string;
  variant?: CanvasSwitcherVariant;
}) {
  const [open, setOpen] = useState(false);
  const isDark = variant === "dark";

  const activeCanvas = useMemo(
    () => canvases.find((c) => c.id === activeCanvasId),
    [canvases, activeCanvasId],
  );

  return (
    <div className="relative">
      {/* trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={[
          "flex h-8 w-8 items-center justify-center rounded-md transition",
          isDark
            ? "bg-white/[0.08] text-white/80 hover:bg-white/[0.14] hover:text-white"
            : "bg-white text-black hover:bg-white/90",
        ].join(" ")}
        aria-label={`Switch canvas${activeCanvas ? ` from ${activeCanvas.name}` : ""}`}
      >
        <Layers className="h-4 w-4" />
      </button>

      {/* overlay */}
      {open && (
        <>
          {/* backdrop */}
          <div
            className="fixed inset-0 z-[999]"
            onClick={() => setOpen(false)}
          />

          {/* dropdown */}
          <div
            className={[
              "absolute left-0 top-full z-[1000] mt-2 w-64 overflow-hidden rounded shadow-lg",
              isDark
                ? "border border-white/10 bg-[#1f1f1f] shadow-black/40"
                : "bg-white",
            ].join(" ")}
          >

            {/* list */}
            <div className="max-h-64 overflow-auto p-1 scrollbar-hidden">
              {canvases.length === 0 ? (
                <div
                  className={[
                    "px-2 py-3 text-sm",
                    isDark ? "text-white/50" : "text-black/60",
                  ].join(" ")}
                >
                  No canvases found
                </div>
              ) : (
                canvases.map((canvas) => (
                  <Link
                    key={canvas.id}
                    href={`/canvas/${canvas.slug}`}
                    onClick={() => setOpen(false)}
                    className={`block rounded px-2 py-1 text-[13px] tracking-tight transition ${
                      canvas.id === activeCanvasId
                        ? isDark
                          ? "border border-white/20 bg-white/[0.08] text-white"
                          : "lime border-2 border-black/20 text-black"
                        : isDark
                          ? "text-white/70 hover:bg-white/[0.08] hover:text-white"
                          : "text-black/80 hover:bg-black/5"
                    }`}
                  >
                    {canvas.name}
                  </Link>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
