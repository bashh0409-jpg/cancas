"use client";

import type { CanvasContentsItem } from "@/app/components/canvas/CanvasContentsPanel";
import { CanvasSwitcher } from "@/app/components/canvas/CanvasSwitcher";
import {
  AlertCircle,
  AudioLines,
  CheckCircle2,
  ChevronDown,
  Cloud,
  Eye,
  EyeOff,
  Globe,
  Grid2x2,
  ImageIcon,
  Loader2,
  Maximize2,
  Minus,
  Palette,
  Plus,
  RotateCcw,
  Ruler,
  StickyNote,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

type ImageSyncStats = {
  synced: number;
  total: number;
  failed: number;
};

type CanvasLeftSidebarProps = {
  activeCanvasId: string;
  canvases: { id: string; name: string; slug: string }[];
  canZoomIn: boolean;
  canZoomOut: boolean;
  zoomPercent: string;
  onResetZoom: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitToView: () => void;
  showGrid: boolean;
  backgroundColor: string;
  gridColor: string;
  gridSize: number;
  onToggleShowGrid: () => void;
  onBackgroundColorChange: (color: string) => void;
  onGridColorChange: (color: string) => void;
  onGridSizeChange: (size: number) => void;
  onResetGrid: () => void;
  layers: CanvasContentsItem[];
  onFocusLayer: (item: CanvasContentsItem) => void;
  syncStats: ImageSyncStats;
  isSavingCanvas: boolean;
  saveError: string | null;
};

const LAYER_ICONS = {
  image: ImageIcon,
  website: Globe,
  voice: AudioLines,
  text: StickyNote,
  cloud: Cloud,
} as const;

const LAYER_LABELS = {
  image: "Image",
  website: "Web",
  voice: "Voice",
  text: "Note",
  cloud: "Cloud",
} as const;

type SaveStatus = "saved" | "saving" | "uploading" | "error";

function deriveSaveStatus(
  isSavingCanvas: boolean,
  saveError: string | null,
  syncStats: ImageSyncStats,
): SaveStatus {
  if (saveError || syncStats.failed > 0) {
    return "error";
  }

  if (isSavingCanvas) {
    return "saving";
  }

  if (syncStats.synced < syncStats.total) {
    return "uploading";
  }

  return "saved";
}

export function CanvasLeftSidebar({
  activeCanvasId,
  canvases,
  canZoomIn,
  canZoomOut,
  zoomPercent,
  onResetZoom,
  onZoomIn,
  onZoomOut,
  onFitToView,
  showGrid,
  backgroundColor,
  gridColor,
  gridSize,
  onToggleShowGrid,
  onBackgroundColorChange,
  onGridColorChange,
  onGridSizeChange,
  onResetGrid,
  layers,
  onFocusLayer,
  syncStats,
  isSavingCanvas,
  saveError,
}: CanvasLeftSidebarProps) {
  const [gridExpanded, setGridExpanded] = useState(true);
  const [layersExpanded, setLayersExpanded] = useState(true);

  const saveStatus = deriveSaveStatus(isSavingCanvas, saveError, syncStats);

  const saveConfig = useMemo(() => {
    switch (saveStatus) {
      case "saving":
        return {
          icon: <Loader2 className="h-3.5 w-3.5 animate-spin text-white/50" />,
          label: "Saving canvas…",
          detail: "Changes are being synced",
        };
      case "uploading":
        return {
          icon: <Loader2 className="h-3.5 w-3.5 animate-spin text-white/50" />,
          label: `Uploading ${syncStats.total - syncStats.synced}`,
          detail: `${syncStats.synced}/${syncStats.total} files synced`,
        };
      case "error":
        return {
          icon: <AlertCircle className="h-3.5 w-3.5 text-red-400" />,
          label: saveError
            ? "Save failed"
            : `${syncStats.failed} upload failed`,
          detail:
            saveError ??
            `${syncStats.synced}/${syncStats.total} files synced successfully`,
        };
      default:
        return {
          icon: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400/80" />,
          label: "All changes saved",
          detail:
            syncStats.total > 0
              ? `${syncStats.total} file${syncStats.total !== 1 ? "s" : ""} in cloud`
              : "Canvas is up to date",
        };
    }
  }, [saveError, saveStatus, syncStats]);

  return (
    <aside
      aria-label="Canvas controls"
      className={[
        "absolute left-0 top-0 bottom-0 z-50 flex w-[220px] flex-col",
        "border-r border-white/[0.06] bg-[#141414]",
        "select-none",
      ].join(" ")}
      onPointerDown={(event) => event.stopPropagation()}
      onWheel={(event) => event.stopPropagation()}
    >
      <div className="flex items-center gap-2 border-b border-white/[0.06] p-3">
        <Link
          aria-label="Go back"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.08] text-white/70 transition hover:bg-white/[0.12] hover:text-white"
          href="/work"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>

        <div className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/[0.04] p-0.5">
          <CanvasSwitcher
            activeCanvasId={activeCanvasId}
            canvases={canvases}
            variant="dark"
          />
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {/* View controls */}
        <SidebarSection label="View">
          <button
            aria-label="Fit all content to view"
            className={sidebarButtonClass}
            type="button"
            onClick={onFitToView}
          >
            <Maximize2 className="h-3.5 w-3.5 text-white/50" />
            <span>Fit to view</span>
          </button>

          <div className="flex items-center gap-1 rounded-lg bg-white/[0.04] p-1">
            <IconButton
              disabled={!canZoomOut}
              label="Zoom out"
              onClick={onZoomOut}
            >
              <Minus className="h-3.5 w-3.5" />
            </IconButton>

            <button
              aria-label="Reset zoom to 100%"
              className="flex h-7 w-7 flex-1 items-center justify-center rounded-md font-mono text-[11px] font-medium text-white/70 transition hover:bg-white/[0.06] hover:text-white"
              title="Reset zoom to 100%"
              type="button"
              onClick={onResetZoom}
            >
              {zoomPercent}
            </button>

            <IconButton
              disabled={!canZoomIn}
              label="Zoom in"
              onClick={onZoomIn}
            >
              <Plus className="h-3.5 w-3.5" />
            </IconButton>
          </div>
        </SidebarSection>

        <SidebarDivider />

        {/* Grid controls */}
        <CollapsibleSection
          count={null}
          expanded={gridExpanded}
          label="Canvas"
          onToggle={() => setGridExpanded((current) => !current)}
        >
          <button
            aria-label={showGrid ? "Hide grid" : "Show grid"}
            className={sidebarButtonClass}
            type="button"
            onClick={onToggleShowGrid}
          >
            {showGrid ? (
              <Eye className="h-3.5 w-3.5 text-white/50" />
            ) : (
              <EyeOff className="h-3.5 w-3.5 text-white/50" />
            )}
            <span>{showGrid ? "Grid visible" : "Grid hidden"}</span>
            <span
              className={[
                "ml-auto h-4 w-7 rounded-full transition-colors",
                showGrid ? "bg-[#0d99ff]" : "bg-white/10",
              ].join(" ")}
            >
              <span
                className={[
                  "mt-0.5 block h-3 w-3 rounded-full bg-white shadow transition-transform",
                  showGrid ? "translate-x-3.5" : "translate-x-0.5",
                ].join(" ")}
              />
            </span>
          </button>

          <SidebarColorRow
            icon={<Palette className="h-3 w-3" />}
            label="Background"
            value={backgroundColor}
            onChange={onBackgroundColorChange}
          />

          <SidebarColorRow
            icon={<Grid2x2 className="h-3 w-3" />}
            label="Grid color"
            value={gridColor}
            onChange={onGridColorChange}
          />

          <SidebarNumberRow
            icon={<Ruler className="h-3 w-3" />}
            label="Grid size"
            max={80}
            min={12}
            step={4}
            value={gridSize}
            onChange={onGridSizeChange}
          />

          <button
            aria-label="Reset canvas settings"
            className={sidebarButtonClass}
            type="button"
            onClick={onResetGrid}
          >
            <RotateCcw className="h-3.5 w-3.5 text-white/50" />
            <span>Reset canvas</span>
          </button>
        </CollapsibleSection>

        <SidebarDivider />

        {/* Layers */}
        <CollapsibleSection
          count={layers.length}
          expanded={layersExpanded}
          label="Layers"
          onToggle={() => setLayersExpanded((current) => !current)}
        >
          <div className="scrollbar-hide max-h-48 overflow-y-auto">
            {layers.length === 0 ? (
              <p className="px-2 py-2 text-[11px] leading-relaxed text-white/35">
                No elements yet. Drop files onto the canvas to get started.
              </p>
            ) : (
              layers.map((item) => {
                const Icon = LAYER_ICONS[item.kind];

                return (
                  <button
                    key={`${item.kind}-${item.id}`}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition hover:bg-white/[0.06]"
                    type="button"
                    onClick={() => onFocusLayer(item)}
                  >
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/[0.06] text-white/50">
                      <Icon className="h-3 w-3" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[11px] font-medium text-white/80">
                        {item.label}
                      </div>
                      <div className="text-[9px] uppercase tracking-wider text-white/30">
                        {LAYER_LABELS[item.kind]}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </CollapsibleSection>
      </div>

      {/* Save status */}
      <div className="shrink-0 border-t border-white/[0.06] p-3">
        <div className="flex items-start gap-2 rounded-lg bg-white/[0.03] px-2.5 py-2">
          <div className="mt-0.5 shrink-0">{saveConfig.icon}</div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-white/75">
              {saveConfig.label}
            </p>
            <p className="mt-0.5 truncate text-[10px] text-white/35">
              {saveConfig.detail}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}

const sidebarButtonClass =
  "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] text-white/70 transition hover:bg-white/[0.06] hover:text-white";

type SidebarSectionProps = {
  label: string;
  children: React.ReactNode;
};

function SidebarSection({ label, children }: SidebarSectionProps) {
  return (
    <section className="px-3 py-3">
      <h2 className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-widest text-white/30">
        {label}
      </h2>
      <div className="space-y-1.5">{children}</div>
    </section>
  );
}

type CollapsibleSectionProps = {
  label: string;
  count: number | null;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
};

function CollapsibleSection({
  label,
  count,
  expanded,
  onToggle,
  children,
}: CollapsibleSectionProps) {
  return (
    <section className="flex min-h-0 flex-col px-3 py-2">
      <button
        aria-expanded={expanded}
        className="mb-1 flex w-full items-center gap-1.5 rounded-md px-1 py-1 text-left transition hover:bg-white/[0.04]"
        type="button"
        onClick={onToggle}
      >
        <ChevronDown
          className={[
            "h-3 w-3 text-white/35 transition-transform",
            expanded ? "" : "-rotate-90",
          ].join(" ")}
        />
        <h2 className="text-[10px] font-semibold uppercase tracking-widest text-white/30">
          {label}
        </h2>
        {count !== null ? (
          <span className="ml-auto rounded bg-white/[0.06] px-1.5 py-0.5 text-[9px] font-medium text-white/45">
            {count}
          </span>
        ) : null}
      </button>

      {expanded ? <div className="space-y-1.5">{children}</div> : null}
    </section>
  );
}

function SidebarDivider() {
  return <div className="mx-3 border-t border-white/[0.06]" />;
}

type IconButtonProps = {
  children: React.ReactNode;
  label: string;
  disabled?: boolean;
  onClick: () => void;
};

function IconButton({ children, label, disabled, onClick }: IconButtonProps) {
  return (
    <button
      aria-label={label}
      className={[
        "flex h-7 w-7 items-center justify-center rounded-md text-white/50 transition",
        "hover:bg-white/[0.06] hover:text-white",
        "disabled:pointer-events-none disabled:opacity-30",
      ].join(" ")}
      disabled={disabled}
      title={label}
      type="button"
      onClick={onClick}
    >
      {children}
    </button>
  );
}

type SidebarColorRowProps = {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (value: string) => void;
};

function SidebarColorRow({
  icon,
  label,
  value,
  onChange,
}: SidebarColorRowProps) {
  return (
    <label className="flex h-8 cursor-pointer items-center gap-2 rounded-lg bg-white/[0.04] px-2 transition hover:bg-white/[0.06]">
      <span className="text-white/35">{icon}</span>
      <span className="flex-1 text-[11px] text-white/55">{label}</span>
      <span
        className="h-4 w-4 rounded border border-white/10"
        style={{ backgroundColor: value }}
      />
      <span className="font-mono text-[10px] text-white/35">
        {value.replace("#", "").toUpperCase()}
      </span>
      <input
        aria-label={label}
        className="sr-only"
        type="color"
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
      />
    </label>
  );
}

type SidebarNumberRowProps = {
  icon: React.ReactNode;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
};

function SidebarNumberRow({
  icon,
  label,
  value,
  min,
  max,
  step,
  onChange,
}: SidebarNumberRowProps) {
  return (
    <label className="flex h-8 items-center gap-2 rounded-lg bg-white/[0.04] px-2">
      <span className="text-white/35">{icon}</span>
      <span className="flex-1 text-[11px] text-white/55">{label}</span>
      <input
        aria-label={label}
        className="w-10 bg-transparent text-right font-mono text-[11px] text-white/70 outline-none"
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
      <span className="text-[10px] text-white/30">px</span>
    </label>
  );
}
