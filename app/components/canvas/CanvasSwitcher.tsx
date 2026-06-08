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
        className="h-8 w-8 flex items-center justify-center rounded-lg bg-white text-black/70 hover:bg-white/90 transition"
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
          <div className="absolute left-0 top-full mt-2 z-[1000] w-64 rounded-lg border bg-white shadow-lg">
            <div className="p-2 text-xs text-black/50 border-b">Projects</div>

            <div className="max-h-64 overflow-auto p-1">
              {canvases.length === 0 ? (
                <div className="px-2 py-3 text-sm text-black/50">
                  No canvases found
                </div>
              ) : (
                canvases.map((canvas) => (
                  <Link
                    key={canvas.id}
                    href={`/canvas/${canvas.slug}`}
                    onClick={() => setOpen(false)}
                    className={`block rounded px-2 py-2 text-sm transition hover:bg-black/5 ${
                      canvas.id === activeCanvasId
                        ? "bg-black/5 text-black"
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
