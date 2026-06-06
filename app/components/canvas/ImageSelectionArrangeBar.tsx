"use client";

import {
  getDefaultLayoutSize,
  getDefaultTrackCount,
  type LayoutArrangeRequest,
  type LayoutDirection,
  type LayoutKind,
} from "@/lib/canvas/imageLayouts";
import { Grid2x2, LayoutPanelTop, PanelsTopLeft, X } from "lucide-react";
import { useMemo, useState } from "react";

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

  const [size, setSize] = useState(() =>
    getDefaultLayoutSize("grid", "vertical"),
  );

  const [tracks, setTracks] = useState(() => getDefaultTrackCount(count, 6));

  const maxTracks = useMemo(
    () => Math.min(MAX_TRACKS, Math.max(1, count)),
    [count],
  );

  const clampedTracks = Math.min(Math.max(MIN_TRACKS, tracks), maxTracks);

  const sizeLabel =
    kind === "grid" ? "Cell" : direction === "vertical" ? "Width" : "Height";

  const tracksLabel = direction === "vertical" ? "Cols" : "Rows";

  function handleKindChange(nextKind: LayoutKind) {
    setKind(nextKind);
    setSize(getDefaultLayoutSize(nextKind, direction));
  }

  function handleDirectionChange(nextDirection: LayoutDirection) {
    setDirection(nextDirection);

    setSize(getDefaultLayoutSize(kind, nextDirection));

    setTracks(
      getDefaultTrackCount(count, nextDirection === "vertical" ? 6 : 5),
    );
  }

  function applyLayout() {
    onArrange({
      kind,
      direction,
      size,
      tracks: clampedTracks,
    });
  }

  return (
    <div
      aria-label="Arrange selected images"
      className="pointer-events-auto fixed left-1/2 top-13 z-[60] w-[340px] -translate-x-1/2 rounded-xl border border-black/10 bg-white/95 p-2 text-black shadow-[0_12px_40px_rgba(0,0,0,0.12)] backdrop-blur-xl"
      role="toolbar"
    >
      <div className="flex items-center gap-1.5">
        <ToolbarIconButton
          active={kind === "grid"}
          onClick={() => handleKindChange("grid")}
        >
          <Grid2x2 className="h-4 w-4" />
        </ToolbarIconButton>

        <ToolbarIconButton
          active={kind === "pinterest"}
          onClick={() => handleKindChange("pinterest")}
        >
          <PanelsTopLeft className="h-4 w-4" />
        </ToolbarIconButton>

        <div className="mx-1 h-5 w-px bg-black/10" />

        <ToolbarIconButton
          active={direction === "vertical"}
          blue
          onClick={() => handleDirectionChange("vertical")}
        >
          <LayoutPanelTop className="h-4 w-4 rotate-90" />
        </ToolbarIconButton>

        <ToolbarIconButton
          active={direction === "horizontal"}
          blue
          onClick={() => handleDirectionChange("horizontal")}
        >
          <LayoutPanelTop className="h-4 w-4" />
        </ToolbarIconButton>

        <div className="ml-auto flex items-center gap-1">
          <button
            className="h-8 rounded-md bg-[#2244ec] px-3 text-[11px] font-semibold text-white transition hover:bg-[#0b87e0]"
            type="button"
            onClick={applyLayout}
          >
            Apply
          </button>

          <button
            aria-label="Close selection"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-black/40 transition hover:bg-black/[0.04] hover:text-black"
            type="button"
            onClick={onClearSelection}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-2 flex gap-2 border-t border-black/5 pt-2">
        <CompactInput
          label={sizeLabel}
          max={MAX_SIZE}
          min={MIN_SIZE}
          step={10}
          value={size}
          valueSuffix="px"
          onChange={setSize}
        />

        <CompactInput
          label={tracksLabel}
          max={maxTracks}
          min={MIN_TRACKS}
          step={1}
          value={clampedTracks}
          onChange={setTracks}
        />
      </div>

      <div className="mt-2 flex items-center justify-between rounded-lg bg-black/[0.03] px-2.5 py-2 text-[11px]">
        <span className="text-black/50">{count} selected</span>

        <span className="rounded-md bg-black/[0.04] px-2 py-1 text-black/70">
          {kind} · {direction}
        </span>
      </div>
    </div>
  );
}

type ToolbarIconButtonProps = {
  active?: boolean;
  blue?: boolean;
  children: React.ReactNode;
  onClick: () => void;
};

function ToolbarIconButton({
  active,
  blue,
  children,
  onClick,
}: ToolbarIconButtonProps) {
  return (
    <div className="rounded-lg bg-black/[0.04] p-1">
      <button
        aria-pressed={active}
        className={[
          "flex h-8 w-8 items-center justify-center rounded-md transition",
          active
            ? blue
              ? "bg-[#2244ec] text-white"
              : "bg-black text-white"
            : "text-black/50 hover:bg-black/[0.04] hover:text-black",
        ].join(" ")}
        type="button"
        onClick={onClick}
      >
        {children}
      </button>
    </div>
  );
}

type CompactInputProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  valueSuffix?: string;
  onChange: (value: number) => void;
};

function CompactInput({
  label,
  value,
  min,
  max,
  step,
  valueSuffix,
  onChange,
}: CompactInputProps) {
  return (
    <label className="flex w-full items-center justify-between rounded-lg bg-black/[0.03] px-2 py-1">
      <span className="text-[11px] font-medium text-black/55">{label}</span>

      <div className="flex items-center gap-1">
        <input
          aria-label={label}
          className="h-6 w-16 rounded-md border border-black/10 bg-white px-2 text-right font-mono text-[11px] text-black outline-none transition focus:border-[#2244ec]"
          max={max}
          min={min}
          step={step}
          type="number"
          value={value}
          onChange={(event) => {
            const nextValue = Number(event.currentTarget.value);

            if (Number.isNaN(nextValue)) {
              return;
            }

            // Clamp immediately to keep layout engine stable.
            onChange(Math.min(Math.max(nextValue, min), max));
          }}
        />

        {valueSuffix ? (
          <span className="text-[11px] text-black/45">{valueSuffix}</span>
        ) : null}
      </div>
    </label>
  );
}
