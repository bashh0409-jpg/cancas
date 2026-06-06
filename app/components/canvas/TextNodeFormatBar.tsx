import {
  CANVAS_TEXT_BACKGROUNDS,
  CANVAS_TEXT_COLORS,
  CANVAS_TEXT_FONTS,
} from "./canvasTextOptions";
import { Droplet, Minus, Palette, Plus, Text } from "lucide-react";

type TextNodeFormatBarProps = {
  backgroundColor: string;
  color: string;
  fontFamily: string;
  fontSize: number;
  onBackgroundColorChange: (color: string) => void;
  onColorChange: (color: string) => void;
  onFontFamilyChange: (fontFamily: string) => void;
  onFontSizeChange: (fontSize: number) => void;
};

function Swatch({
  color,
  label,
  selected,
  onClick,
}: {
  color: string;
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      aria-pressed={selected}
      className={[
        "h-6 w-6 rounded-full border transition",
        selected ? "border-white" : "border-white/20 hover:border-white/60",
      ].join(" ")}
      title={label}
      type="button"
      onClick={onClick}
    >
      <span
        className="block h-full w-full rounded-full"
        style={{
          background:
            color === "transparent"
              ? "linear-gradient(135deg, transparent 0 44%, #ef4444 45% 55%, transparent 56% 100%), conic-gradient(#fff 0 25%, #777 0 50%, #fff 0 75%, #777 0)"
              : color,
        }}
      />
    </button>
  );
}

export function TextNodeFormatBar({
  backgroundColor,
  color,
  fontFamily,
  fontSize,
  onBackgroundColorChange,
  onColorChange,
  onFontFamilyChange,
  onFontSizeChange,
}: TextNodeFormatBarProps) {
  return (
    <div
      className="pointer-events-auto fixed left-1/2 top-16 z-[60] flex max-w-[calc(100vw-2rem)] -translate-x-1/2 flex-wrap items-center gap-2 rounded-full border border-white/10 bg-slate-950/95 px-2 py-1.5 text-white shadow-[0_12px_32px_rgba(0,0,0,0.30)] backdrop-blur"
      role="toolbar"
      onPointerDown={(event) => event.stopPropagation()}
      onWheel={(event) => event.stopPropagation()}
    >
      <div className="flex h-8 items-center gap-2 rounded-full border border-white/10 bg-slate-900/80 px-2 text-white transition hover:bg-slate-900">
        <Text className="h-4 w-4 text-white/70" />
        <select
          aria-label="Font family"
          className="h-8 min-w-[120px] rounded-full bg-transparent px-1 text-[11px] text-white outline-none appearance-none"
          value={fontFamily}
          onChange={(event) => onFontFamilyChange(event.currentTarget.value)}
        >
          {CANVAS_TEXT_FONTS.map((font) => (
            <option key={font.label} value={font.value}>
              {font.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex h-8 items-center gap-1 rounded-full border border-white/10 bg-slate-900/80 px-1">
        <button
          aria-label="Decrease font size"
          className="h-8 w-8 rounded-l-full text-white/70 transition hover:bg-white/10 hover:text-white"
          type="button"
          onClick={() => onFontSizeChange(Math.max(8, fontSize - 2))}
        >
          <Minus className="h-4 w-4" />
        </button>
        <input
          aria-label="Font size"
          className="h-8 w-12 bg-transparent text-center text-xs text-white outline-none"
          max="240"
          min="8"
          type="number"
          value={fontSize}
          onChange={(event) =>
            onFontSizeChange(
              Math.min(
                240,
                Math.max(8, Number(event.currentTarget.value) || 8),
              ),
            )
          }
        />
        <button
          aria-label="Increase font size"
          className="h-8 w-8 rounded-r-full text-white/70 transition hover:bg-white/10 hover:text-white"
          type="button"
          onClick={() => onFontSizeChange(Math.min(240, fontSize + 2))}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div className="hidden h-5 w-px bg-white/15 sm:block" />

      <div className="flex h-8 items-center gap-1 rounded-full border border-white/10 bg-slate-900/80 px-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white/70">
          <Palette className="h-4 w-4" />
        </span>
        {CANVAS_TEXT_COLORS.map((entry) => (
          <Swatch
            key={entry}
            color={entry}
            label={`Text color ${entry}`}
            selected={color === entry}
            onClick={() => onColorChange(entry)}
          />
        ))}
        <input
          aria-label="Custom text color"
          className="h-7 w-7 cursor-pointer rounded-full border border-white/15 bg-transparent p-0"
          type="color"
          value={color === "transparent" ? "#ffffff" : color}
          onChange={(event) => onColorChange(event.currentTarget.value)}
        />
      </div>

      <div className="hidden h-5 w-px bg-white/15 sm:block" />

      <div className="flex h-8 items-center gap-1 rounded-full border border-white/10 bg-slate-900/80 px-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white/70">
          <Droplet className="h-4 w-4" />
        </span>
        {CANVAS_TEXT_BACKGROUNDS.map((entry) => (
          <Swatch
            key={entry}
            color={entry}
            label={`Background ${entry}`}
            selected={backgroundColor === entry}
            onClick={() => onBackgroundColorChange(entry)}
          />
        ))}
        <input
          aria-label="Custom background color"
          className="h-7 w-7 cursor-pointer rounded-full border border-white/15 bg-transparent p-0"
          type="color"
          value={
            backgroundColor === "transparent" ? "#111111" : backgroundColor
          }
          onChange={(event) =>
            onBackgroundColorChange(event.currentTarget.value)
          }
        />
      </div>
    </div>
  );
}
