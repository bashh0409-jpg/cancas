"use client";

import {
  Eye,
  EyeOff,
  Grid2x2,
  Palette,
  Ruler,
  Settings2,
  RotateCcw,
  Sidebar,
} from "lucide-react";

type CanvasGridControlsProps = {
  isOpen: boolean;
  showGrid: boolean;
  backgroundColor: string;
  gridColor: string;
  gridSize: number;
  gridSizePercent: number;
  onToggleOpen: () => void;
  onToggleShowGrid: () => void;
  onBackgroundColorChange: (color: string) => void;
  onGridColorChange: (color: string) => void;
  onGridSizeChange: (size: number) => void;
  onReset: () => void; // FIX: parent must fully restore defaults; local reset logic cannot guess state
};

<Sidebar />

export function CanvasGridControls({
  isOpen,
  showGrid,
  backgroundColor,
  gridColor,
  gridSize,
  onToggleOpen,
  onToggleShowGrid,
  onBackgroundColorChange,
  onGridColorChange,
  onGridSizeChange,
  onReset,
}: CanvasGridControlsProps) {
  return (
    <div
      className="absolute left-4 top-1/2 z-40 -translate-y-1/2"
      onWheel={(event) => event.stopPropagation()}
    >
      <div className="flex items-center gap-1.5">
        <button
          aria-expanded={isOpen}
          aria-label="Grid settings"
          className={[
            "flex h-9 w-9 items-center justify-center rounded-xl",
            "border border-black/10 bg-white/95 text-black",
            "shadow-[0_8px_24px_rgba(0,0,0,0.08)] backdrop-blur-xl",
            isOpen ? "ring-2 ring-[#2244ec]/15" : "",
          ].join(" ")}
          type="button"
          onClick={onToggleOpen}
        >
          <Settings2 className="h-4 w-4" />
        </button>

        <aside
          aria-hidden={!isOpen}
          className={[
            "overflow-hidden rounded-xl border border-black/10 bg-white/95",
            "shadow-[0_12px_32px_rgba(0,0,0,0.10)] backdrop-blur-xl",
            "transition-all duration-200 ease-out",
            isOpen
              ? "pointer-events-auto translate-x-0 opacity-100"
              : "pointer-events-none -translate-x-2 opacity-0",
          ].join(" ")}
        >
          <div className="flex items-center gap-1 p-1">
            <CompactColorInput
              icon={<Palette className="h-3 w-3" />}
              label="Background"
              value={backgroundColor}
              onChange={onBackgroundColorChange}
            />

            <CompactColorInput
              icon={<Grid2x2 className="h-3 w-3" />}
              label="Grid"
              value={gridColor}
              onChange={onGridColorChange}
            />

            <CompactNumberInput
              icon={<Ruler className="h-3 w-3" />}
              label="Grid size"
              max={80}
              min={12}
              step={4}
              value={gridSize}
              onChange={onGridSizeChange}
            />

            <button
              aria-label="Toggle grid"
              className={[
                "flex h-8 w-8 items-center justify-center rounded-lg transition",
                showGrid
                  ? "bg-[#2244ec] text-white"
                  : "bg-black/[0.04] text-black/50 hover:text-black",
              ].join(" ")}
              type="button"
              onClick={onToggleShowGrid}
            >
              {showGrid ? (
                <Eye className="h-3.5 w-3.5" />
              ) : (
                <EyeOff className="h-3.5 w-3.5" />
              )}
            </button>

            {/* RESET */}
            <button
              aria-label="Reset settings"
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-black/[0.04] text-black/60 hover:bg-black/[0.08] hover:text-black"
              type="button"
              onClick={onReset}
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

type CompactColorInputProps = {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (value: string) => void;
};

function CompactColorInput({
  icon,
  label,
  value,
  onChange,
}: CompactColorInputProps) {
  return (
    <label className="relative flex h-8 items-center gap-1.5 rounded-lg bg-black/[0.04] px-2">
      <div className="text-black/45">{icon}</div>

      <div
        className="h-3.5 w-3.5 rounded-[4px] border border-black/10"
        style={{ backgroundColor: value }}
      />

      <span className="w-[42px] text-[10px] font-medium uppercase tracking-tight text-black/60">
        {value.replace("#", "")}
      </span>

      <input
        aria-label={label}
        className="absolute inset-0 cursor-pointer opacity-0"
        type="color"
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
      />
    </label>
  );
}

type CompactNumberInputProps = {
  icon: React.ReactNode;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
};

function CompactNumberInput({
  icon,
  label,
  value,
  min,
  max,
  step,
  onChange,
}: CompactNumberInputProps) {
  return (
    <label className="flex h-8 items-center gap-1.5 rounded-lg bg-black/[0.04] px-2">
      <div className="text-black/45">{icon}</div>

      <input
        aria-label={label}
        className="w-9 bg-transparent text-right font-mono text-[10px] text-black outline-none"
        max={max}
        min={min}
        step={step}
        type="number"
        value={value}
        onChange={(event) => {
          const nextValue = Number(event.currentTarget.value);
          if (Number.isNaN(nextValue)) return;

          onChange(Math.min(Math.max(nextValue, min), max));
        }}
      />

      <span className="text-[10px] text-black/45">px</span>
    </label>
  );
}
