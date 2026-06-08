"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Layers } from "lucide-react";

type Canvas = {
  id: string;
  name: string;
  slug: string;
};

export function CanvasSwitcher({
  canvases = [],
  activeCanvasId,
}: {
  canvases?: Canvas[];
  activeCanvasId: string;
}) {
  const [open, setOpen] = useState(false);

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
        className="h-8 w-8 flex items-center justify-center rounded-md bg-white text-black hover:bg-white/90 transition"
        aria-label="Switch canvas"
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
          <div className="absolute left-0 top-full mt-2 z-[1000] w-64 rounded bg-white shadow-lg overflow-hidden">

            {/* list */}
            <div className="max-h-64 overflow-auto p-1 scrollbar-hidden">
              {canvases.length === 0 ? (
                <div className="px-2 py-3 text-sm text-black/60">
                  No canvases found
                </div>
              ) : (
                canvases.map((canvas) => (
                  <Link
                    key={canvas.id}
                    href={`/canvas/${canvas.slug}`}
                    onClick={() => setOpen(false)}
                    className={`block rounded px-2 py-1 text-[13px] tracking-tight transition hover:bg-black/5 ${
                      canvas.id === activeCanvasId
                        ? "lime border-black/20 border border-2 text-black"
                        : "text-black/80"
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
