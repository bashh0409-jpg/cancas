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
};

export function CanvasGridControls({
  isOpen,
  showGrid,
  backgroundColor,
  gridColor,
  gridSize,
  gridSizePercent,
  onToggleOpen,
  onToggleShowGrid,
  onBackgroundColorChange,
  onGridColorChange,
  onGridSizeChange,
}: CanvasGridControlsProps) {
  return (
    <div
      className="absolute left-4 top-1/2 z-40 -translate-y-1/2 text-white"
      onWheel={(event) => event.stopPropagation()}
    >
      <button
        aria-expanded={isOpen}
        aria-label="Grid settings"
        className={[
          "flex h-10 w-10 items-center justify-center rounded-full border shadow-[0_12px_32px_rgba(0,0,0,0.38)] backdrop-blur transition duration-200",
          isOpen
            ? "border-[#0d99ff] bg-[#0d99ff] text-white"
            : "border-white/10 bg-zinc-950/90 text-white/75 hover:bg-zinc-900",
        ].join(" ")}
        type="button"
        onClick={onToggleOpen}
      >
        <svg
          aria-hidden="true"
          className={[
            "h-5 w-5 transition duration-300",
            isOpen ? "rotate-45 scale-95" : "rotate-0 scale-100",
          ].join(" ")}
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            d="M8 3v18M16 3v18M3 8h18M3 16h18"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.7"
          />
        </svg>
      </button>

      <aside
        aria-hidden={!isOpen}
        className={[
          "absolute left-14 top-1/2 w-64 rounded-lg border border-white/10 bg-zinc-950/90 p-3 text-sm shadow-[0_18px_48px_rgba(0,0,0,0.42)] backdrop-blur",
          "origin-left transition-[opacity,filter,transform,clip-path] duration-300 ease-[cubic-bezier(.18,.89,.32,1.18)]",
          isOpen
            ? "pointer-events-auto opacity-100 blur-0"
            : "pointer-events-none opacity-0 blur-sm",
        ].join(" ")}
        style={{
          clipPath: isOpen
            ? "inset(0% 0% 0% 0% round 12px)"
            : "inset(30% 78% 30% 0% round 999px)",
          transform: isOpen
            ? "translateY(-50%) translateX(0) scaleX(1) scaleY(1) skewY(0deg)"
            : "translateY(-50%) translateX(-24px) scaleX(0.2) scaleY(0.46) skewY(-7deg)",
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-white/45">
              Canvas
            </div>
            <div className="mt-0.5 text-sm font-medium text-white">Grid</div>
          </div>
          <button
            aria-label={showGrid ? "Hide grid" : "Show grid"}
            aria-pressed={showGrid}
            className={[
              "group relative h-8 w-14 overflow-hidden rounded-sm border p-0.5 transition",
              showGrid
                ? "border-[#0d99ff]/70 bg-[#0d99ff]/20"
                : "border-white/10 bg-white/5 hover:bg-white/10",
            ].join(" ")}
            type="button"
            onClick={onToggleShowGrid}
          >
            <span
              className={[
                "absolute inset-y-0 w-1/2 rounded bg-white shadow-[0_4px_14px_rgba(0,0,0,0.34)] transition-transform duration-200",
                showGrid ? "translate-x-[24px]" : "translate-x-0",
              ].join(" ")}
            />
            <span
              className={[
                "relative z-10 inline-flex h-full w-1/2 items-center justify-center text-[10px] font-semibold transition",
                showGrid ? "text-white/45" : "text-zinc-950",
              ].join(" ")}
            >
              Off
            </span>
            <span
              className={[
                "relative z-10 inline-flex h-full w-1/2 items-center justify-center text-[10px] font-semibold transition",
                showGrid ? "text-zinc-950" : "text-white/45",
              ].join(" ")}
            >
              On
            </span>
          </button>
        </div>

        <div className="mt-4 grid gap-3">
          <label className="flex items-center justify-between gap-3">
            <span className="text-white/70">Canvas color</span>
            <span className="flex items-center gap-2">
              <span
                className="h-6 w-6 rounded-md border border-white/20"
                style={{ backgroundColor }}
              />
              <input
                aria-label="Canvas color"
                className="h-8 w-8 cursor-pointer rounded-md border-0 bg-transparent p-0"
                type="color"
                value={backgroundColor}
                onChange={(event) =>
                  onBackgroundColorChange(event.currentTarget.value)
                }
              />
            </span>
          </label>

          <label className="flex items-center justify-between gap-3">
            <span className="text-white/70">Grid color</span>
            <span className="flex items-center gap-2">
              <span className="grid h-6 w-6 grid-cols-2 overflow-hidden rounded-md border border-white/20">
                <span style={{ backgroundColor: gridColor }} />
                <span style={{ backgroundColor }} />
                <span style={{ backgroundColor }} />
                <span style={{ backgroundColor: gridColor }} />
              </span>
              <input
                aria-label="Grid color"
                className="h-8 w-8 cursor-pointer rounded-md border-0 bg-transparent p-0"
                type="color"
                value={gridColor}
                onChange={(event) => onGridColorChange(event.currentTarget.value)}
              />
            </span>
          </label>

          <label className="grid gap-2">
            <span className="flex items-center justify-between text-white/70">
              <span>Grid size</span>
              <span className="font-mono text-xs text-white/50">{gridSize}px</span>
            </span>
            <input
              aria-label="Grid size"
              className="h-2 w-full cursor-pointer appearance-none rounded-full bg-transparent [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-zinc-950 [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:shadow-[0_3px_12px_rgba(0,0,0,0.34)] [&::-webkit-slider-thumb]:-mt-[5px] [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-zinc-950 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_3px_12px_rgba(0,0,0,0.42)] [&::-webkit-slider-runnable-track]:h-1.5 [&::-webkit-slider-runnable-track]:rounded-full [&::-moz-range-track]:h-1.5 [&::-moz-range-track]:rounded-full"
              max="80"
              min="12"
              step="4"
              style={{
                background: `linear-gradient(90deg, #0d99ff 0%, #0d99ff ${gridSizePercent}%, rgba(255,255,255,0.14) ${gridSizePercent}%, rgba(255,255,255,0.14) 100%)`,
              }}
              type="range"
              value={gridSize}
              onChange={(event) => onGridSizeChange(Number(event.currentTarget.value))}
            />
          </label>
        </div>
      </aside>
    </div>
  );
}
