"use client";

import type { CSSProperties, WheelEvent } from "react";
import { useMemo, useState } from "react";

type Viewport = {
  x: number;
  y: number;
  zoom: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export default function CanvasWorkspace() {
  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, zoom: 1 });
  const [showGrid, setShowGrid] = useState(true);
  const [backgroundColor, setBackgroundColor] = useState("#111111");
  const [gridColor, setGridColor] = useState("#343434");
  const [gridSize, setGridSize] = useState(32);

  const gridStyle = useMemo<CSSProperties>(() => {
    const scaledSize = gridSize * viewport.zoom;
    const gridColorValue = `${gridColor}66`;

    if (!showGrid) {
      return { backgroundColor };
    }

    return {
      backgroundColor,
      backgroundImage: `linear-gradient(${gridColorValue} 1px, transparent 1px), linear-gradient(90deg, ${gridColorValue} 1px, transparent 1px)`,
      backgroundPosition: `${viewport.x}px ${viewport.y}px`,
      backgroundSize: `${scaledSize}px ${scaledSize}px`,
    };
  }, [backgroundColor, gridColor, gridSize, showGrid, viewport]);

  function handleWheel(event: WheelEvent<HTMLDivElement>) {
    event.preventDefault();

    if (event.ctrlKey || event.metaKey) {
      setViewport((current) => ({
        ...current,
        zoom: clamp(current.zoom - event.deltaY * 0.0015, 0.2, 4),
      }));
      return;
    }

    setViewport((current) => ({
      ...current,
      x: current.x - event.deltaX,
      y: current.y - event.deltaY,
    }));
  }

  return (
    <div
      className="absolute inset-0 cursor-grab overflow-hidden"
      onWheel={handleWheel}
      style={gridStyle}
    >
      <aside
        className="absolute left-4 top-1/2 z-40 flex w-14 -translate-y-1/2 flex-col items-center gap-2 rounded-2xl border border-white/10 bg-zinc-950/90 p-2 text-white shadow-[0_12px_32px_rgba(0,0,0,0.38)] backdrop-blur"
        onWheel={(event) => event.stopPropagation()}
      >
        <button
          aria-label={showGrid ? "Hide grid" : "Show grid"}
          aria-pressed={showGrid}
          className={[
            "flex h-9 w-9 items-center justify-center rounded-xl border text-[11px] font-semibold transition",
            showGrid
              ? "border-[#0d99ff] bg-[#0d99ff] text-white"
              : "border-white/10 bg-white/10 text-white/60",
          ].join(" ")}
          type="button"
          onClick={() => setShowGrid((current) => !current)}
        >
          <svg
            aria-hidden="true"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 18 18"
          >
            <path d="M6 2v14M12 2v14M2 6h14M2 12h14" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
          </svg>
        </button>

        <label
          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-white/10"
          title="Canvas color"
        >
          <span
            className="h-5 w-5 rounded-full border border-white/30"
            style={{ backgroundColor }}
          />
          <input
            aria-label="Canvas color"
            className="sr-only"
            type="color"
            value={backgroundColor}
            onChange={(event) => setBackgroundColor(event.currentTarget.value)}
          />
        </label>

        <label
          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-white/10"
          title="Grid color"
        >
          <span className="grid h-5 w-5 grid-cols-2 overflow-hidden rounded-full border border-white/30">
            <span style={{ backgroundColor: gridColor }} />
            <span style={{ backgroundColor }} />
            <span style={{ backgroundColor }} />
            <span style={{ backgroundColor: gridColor }} />
          </span>
          <input
            aria-label="Grid color"
            className="sr-only"
            type="color"
            value={gridColor}
            onChange={(event) => setGridColor(event.currentTarget.value)}
          />
        </label>

        <label className="flex flex-col items-center gap-2">
          <span className="font-mono text-[11px] font-semibold text-white/70">
            {gridSize}
          </span>
          <input
            aria-label="Grid size"
            className="h-24 w-8 accent-[#0d99ff] [writing-mode:vertical-lr]"
            max="80"
            min="12"
            step="4"
            type="range"
            value={gridSize}
            onChange={(event) => setGridSize(Number(event.currentTarget.value))}
          />
        </label>
      </aside>
    </div>
  );
}
