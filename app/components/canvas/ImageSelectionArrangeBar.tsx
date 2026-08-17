"use client";

import {
  getDefaultLayoutSize,
  getDefaultTrackCount,
  type LayoutArrangeRequest,
  type LayoutDirection,
  type LayoutKind,
} from "@/lib/canvas/imageLayouts";
import {
  Grid2x2,
  Columns3,
  Columns2,
  Rows2,
  X,
  Plus,
  Minus,
} from "lucide-react";
import { useMemo, useState } from "react";

type ImageSelectionArrangeBarProps = {
  count: number;
  onArrange: (request: LayoutArrangeRequest) => void;
  onClearSelection: () => void;
};

const MIN_SIZE = 100;
const MAX_SIZE = 400;
const MIN_TRACKS = 1;
const MAX_TRACKS = 30;
const MIN_GAP = 4;
const MAX_GAP = 32;

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

  const [gap, setGap] = useState(12);

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
      gap,
    });
  }

  return (
    <div
      aria-label="Arrange selected images"
      className="pointer-events-auto fixed left-1/2 top-13 z-[60] w-fit -translate-x-1/2 rounded-2xl border border-black/10 bg-white p-1 text-black shadow-[0_12px_40px_rgba(0,0,0,0.12)] backdrop-blur-xl"
      role="toolbar"
    >
      <div className="flex  items-center hi gap-1.5">
        <div className="flex gap-1 p-[3px] bg-black/10 rounded-full">
          <ToolbarIconButton
            active={kind === "grid"}
            onClick={() => handleKindChange("grid")}
          >
            <Grid2x2 className="h-4 stroke-[1.7] w-4" />
          </ToolbarIconButton>

          <ToolbarIconButton
            active={kind === "pinterest"}
            onClick={() => handleKindChange("pinterest")}
          >
            <Columns3 className="h-4 stroke-[1.7] w-4" />
          </ToolbarIconButton>
        </div>

        <div className="mx-1 h-5 w-px bg-black/10" />
        <div className="flex gap-1 p-[3px] bg-black/10 rounded-full">
          <ToolbarIconButton
            active={direction === "vertical"}
            blue
            onClick={() => handleDirectionChange("vertical")}
          >
            <Columns2 className="h-4 stroke-[1.7] w-4" />
          </ToolbarIconButton>

          <ToolbarIconButton
            active={direction === "horizontal"}
            blue
            onClick={() => handleDirectionChange("horizontal")}
          >
            <Rows2 className="h-4 stroke-[1.7] w-4" />
          </ToolbarIconButton>
        </div>

        <div className="ml-auto tracking-tight flex items-center gap-1">
          <button
            className="py-1 uppercase rounded-full lime font-mono px-3 text-[11px] tracking-tight text-black transition hover:bg-[#0b87e0]"
            type="button"
            onClick={applyLayout}
          >
            Apply
          </button>

          <button
            aria-label="Close selection"
            className="flex h-8 w-8 hidden items-center justify-center rounded-lg text-black/40 transition hover:bg-black/[0.04] hover:text-black"
            type="button"
            onClick={onClearSelection}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-2 w-fit flex gap-1 border-t border-black/5 pt-2">
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

        <CompactInput
          label="Gap"
          max={MAX_GAP}
          min={MIN_GAP}
          step={2}
          value={gap}
          valueSuffix="px"
          onChange={setGap}
        />
      </div>

      <div className="mt-2 flex hidden items-center justify-between rounded-full bg-black/[0.03] font-mono uppercase tracking-tight px-2 py-1 text-[11px]">
        <span className="text-black/50">
          <span className="grotesk">{count}</span> selected
        </span>

        <span className="rounded-full uppercase font-mono tracking-tight  py-1 text-black/70">
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
    <div className="rounded-full  ">
      <button
        aria-pressed={active}
        className={[
          "flex h-7 rounded-full w-7 items-center justify-center  transition",
          active
            ? blue
              ? "lime text-black"
              : "lime text-black"
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
  function decrement() {
    onChange(Math.max(min, value - step));
  }

  function increment() {
    onChange(Math.min(max, value + step));
  }

  return (
    <label className="flex w-fit items-center justify-between rounded-full bg-black/[0.03] px-1 py-1">
      <span className="text-[11px] font-mono tracking-tight uppercase font-medium text-black/55">
        {label}
      </span>

      <div className="flex items-center ml-2">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          disabled={value <= min}
          onClick={decrement}
          className="flex items-center justify-center rounded-full  transition hover:text-black disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <Minus className="w-3 h-3" />
        </button>

        <input
          aria-label={label}
          type="number"
          className="h-5 w-8 mx-1  rounded-full border border-black/10 bg-white text-center grotesk text-[11px] text-black outline-none transition focus:border-[#2244ec] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          max={max}
          min={min}
          step={step}
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

        <button
          type="button"
          aria-label={`Increase ${label}`}
          disabled={value >= max}
          onClick={increment}
          className="flex items-center justify-center rounded-full  transition disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <Plus className="w-3 h-3" />
        </button>

        {valueSuffix ? (
          <span className="text-[11px] hidden font-mono text-black/45">
            {valueSuffix}
          </span>
        ) : null}
      </div>
    </label>
  );
}