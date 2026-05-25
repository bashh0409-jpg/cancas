"use client";

import {
  getDefaultLayoutSize,
  getDefaultTrackCount,
  type LayoutArrangeRequest,
  type LayoutDirection,
  type LayoutKind,
} from "@/lib/canvas/imageLayouts";
import { useEffect, useMemo, useState } from "react";

type ImageSelectionArrangeBarProps = {
  count: number;
  onArrange: (request: LayoutArrangeRequest) => void;
  onClearSelection: () => void;
};

const MIN_SIZE = 100;
const MAX_SIZE = 400;
const MIN_TRACKS = 1;
const MAX_TRACKS = 12;

export function ImageSelectionArrangeBar({
  count,
  onArrange,
  onClearSelection,
}: ImageSelectionArrangeBarProps) {
  const [kind, setKind] = useState<LayoutKind>("grid");
  const [direction, setDirection] = useState<LayoutDirection>("vertical");
  const [size, setSize] = useState(() => getDefaultLayoutSize("grid", "vertical"));
  const [tracks, setTracks] = useState(() => getDefaultTrackCount(count, 6));

  const maxTracks = useMemo(() => Math.min(MAX_TRACKS, Math.max(1, count)), [count]);
  const sizeLabel = kind === "grid" ? "Cell size" : direction === "vertical" ? "Column width" : "Row height";
  const tracksLabel = direction === "vertical" ? "Columns" : "Rows";

  useEffect(() => {
    setTracks((current) => Math.min(Math.max(MIN_TRACKS, current), maxTracks));
  }, [maxTracks]);

  function handleKindChange(nextKind: LayoutKind) {
    setKind(nextKind);
    setSize(getDefaultLayoutSize(nextKind, direction));
  }

  function handleDirectionChange(nextDirection: LayoutDirection) {
    setDirection(nextDirection);
    setSize(getDefaultLayoutSize(kind, nextDirection));
    setTracks(getDefaultTrackCount(count, nextDirection === "vertical" ? 6 : 5));
  }

  function applyLayout() {
    onArrange({
      kind,
      direction,
      size,
      tracks: Math.min(tracks, maxTracks),
    });
  }

  return (
    <div
      className="pointer-events-auto fixed left-1/2 top-16 z-[60] w-[min(96vw,640px)] -translate-x-1/2 rounded-xl border border-white/10 bg-zinc-950/95 p-3 text-white shadow-[0_16px_48px_rgba(0,0,0,0.45)] backdrop-blur-md"
      role="toolbar"
      aria-label="Arrange selected images"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="px-1 text-xs font-medium text-white/70">
          {count} selected
        </span>
        <span className="hidden h-4 w-px bg-white/15 sm:block" />

        <div className="flex items-center gap-1 rounded-lg bg-white/5 p-0.5">
          <button
            aria-pressed={kind === "grid"}
            className={[
              "rounded-md px-2.5 py-1 text-xs font-semibold transition",
              kind === "grid" ? "bg-white text-zinc-950" : "text-white/70 hover:text-white",
            ].join(" ")}
            type="button"
            onClick={() => handleKindChange("grid")}
          >
            Grid
          </button>
          <button
            aria-pressed={kind === "pinterest"}
            className={[
              "rounded-md px-2.5 py-1 text-xs font-semibold transition",
              kind === "pinterest"
                ? "bg-white text-zinc-950"
                : "text-white/70 hover:text-white",
            ].join(" ")}
            type="button"
            onClick={() => handleKindChange("pinterest")}
          >
            Pinterest
          </button>
        </div>

        <div className="flex items-center gap-1 rounded-lg bg-white/5 p-0.5">
          <button
            aria-label="Vertical layout"
            aria-pressed={direction === "vertical"}
            className={[
              "rounded-md px-2 py-1 text-xs font-semibold transition",
              direction === "vertical"
                ? "bg-[#0d99ff] text-white"
                : "text-white/70 hover:text-white",
            ].join(" ")}
            title="Stack downward (portrait)"
            type="button"
            onClick={() => handleDirectionChange("vertical")}
          >
            ↓ Vertical
          </button>
          <button
            aria-label="Horizontal layout"
            aria-pressed={direction === "horizontal"}
            className={[
              "rounded-md px-2 py-1 text-xs font-semibold transition",
              direction === "horizontal"
                ? "bg-[#0d99ff] text-white"
                : "text-white/70 hover:text-white",
            ].join(" ")}
            title="Stack sideways (landscape)"
            type="button"
            onClick={() => handleDirectionChange("horizontal")}
          >
            → Horizontal
          </button>
        </div>

        <button
          className="ml-auto rounded-lg bg-[#0d99ff] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#0b87e0] sm:ml-0"
          type="button"
          onClick={applyLayout}
        >
          Apply layout
        </button>
        <button
          aria-label="Clear selection"
          className="rounded-lg px-2 py-1.5 text-xs text-white/50 transition hover:bg-white/10 hover:text-white"
          type="button"
          onClick={onClearSelection}
        >
          Clear
        </button>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1.5">
          <span className="flex items-center justify-between text-[11px] text-white/60">
            <span>{sizeLabel}</span>
            <span className="font-mono text-white/80">{size}px</span>
          </span>
          <input
            aria-label={sizeLabel}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-[#0d99ff]"
            max={MAX_SIZE}
            min={MIN_SIZE}
            step={10}
            type="range"
            value={size}
            onChange={(event) => setSize(Number(event.currentTarget.value))}
          />
        </label>

        <label className="grid gap-1.5">
          <span className="flex items-center justify-between text-[11px] text-white/60">
            <span>{tracksLabel}</span>
            <span className="font-mono text-white/80">{Math.min(tracks, maxTracks)}</span>
          </span>
          <input
            aria-label={tracksLabel}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-[#0d99ff]"
            max={maxTracks}
            min={MIN_TRACKS}
            step={1}
            type="range"
            value={Math.min(tracks, maxTracks)}
            onChange={(event) => setTracks(Number(event.currentTarget.value))}
          />
        </label>
      </div>
    </div>
  );
}
