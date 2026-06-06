import { Minus, Plus } from "lucide-react";

type CanvasZoomControlsProps = {
  canZoomIn: boolean;
  canZoomOut: boolean;
  zoomPercent: string;
  onResetZoom: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
};

export function CanvasZoomControls({
  canZoomIn,
  canZoomOut,
  zoomPercent,
  onResetZoom,
  onZoomIn,
  onZoomOut,
}: CanvasZoomControlsProps) {
  return (
    <div
      aria-label="Canvas zoom controls"
      className="absolute right-4 top-[calc(50%+3.5rem)] z-40"
      role="group"
      onWheel={(event) => event.stopPropagation()}
    >
      <div className="flex flex-col w-10 items-center gap-1 rounded-xl border border-black/10 bg-white/95 p-1 text-black shadow-[0_10px_30px_rgba(0,0,0,0.10)] backdrop-blur-xl">
        <ZoomButton disabled={!canZoomOut} label="Zoom out" onClick={onZoomOut}>
          <Minus className="h-3.5 w-3.5" />
        </ZoomButton>

        <button
          aria-label="Reset zoom to 100%"
          className="flex h-8 min-w-[54px] items-center justify-center rounded-lg bg-black/[0.04] px-2 font-mono text-[10px] font-semibold text-black/70 transition hover:bg-black/[0.06] hover:text-black"
          title="Reset zoom to 100%"
          type="button"
          onClick={onResetZoom}
        >
          {zoomPercent}
        </button>

        <ZoomButton disabled={!canZoomIn} label="Zoom in" onClick={onZoomIn}>
          <Plus className="h-3.5 w-3.5" />
        </ZoomButton>
      </div>
    </div>
  );
}

type ZoomButtonProps = {
  children: React.ReactNode;
  label: string;
  disabled?: boolean;
  onClick: () => void;
};

function ZoomButton({ children, label, disabled, onClick }: ZoomButtonProps) {
  return (
    <button
      aria-label={label}
      className={[
        "flex h-8 w-8 items-center justify-center rounded-lg transition",
        "bg-black/[0.04] text-black/60",
        "hover:bg-black/[0.06] hover:text-black",
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
