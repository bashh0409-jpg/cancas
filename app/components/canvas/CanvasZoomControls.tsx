type CanvasZoomControlsProps = {
  canZoomIn: boolean;
  canZoomOut: boolean;
  zoomPercent: string;
  onResetZoom: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
};

function ZoomIcon({ direction }: { direction: "in" | "out" }) {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM15.5 15.5 21 21"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
      <path
        d="M7.5 10.5h6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.7"
      />
      {direction === "in" ? (
        <path
          d="M10.5 7.5v6"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.7"
        />
      ) : null}
    </svg>
  );
}

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
      className="absolute right-4 top-[calc(50%+3.5rem)] z-40 flex flex-col overflow-hidden rounded-full border border-white/10 bg-zinc-950/90 text-white/75 shadow-[0_12px_32px_rgba(0,0,0,0.38)] backdrop-blur"
      role="group"
      onWheel={(event) => event.stopPropagation()}
    >
      <button
        aria-label="Zoom in"
        className="flex h-10 w-10 items-center justify-center transition hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-35"
        disabled={!canZoomIn}
        title="Zoom in"
        type="button"
        onClick={onZoomIn}
      >
        <ZoomIcon direction="in" />
      </button>
      <button
        aria-label="Reset zoom to 100%"
        className="h-10 w-10 border-y border-white/10 px-1 text-center font-mono text-[11px] font-semibold text-white/80 transition hover:bg-white/10 hover:text-white"
        title="Reset zoom to 100%"
        type="button"
        onClick={onResetZoom}
      >
        {zoomPercent}
      </button>
      <button
        aria-label="Zoom out"
        className="flex h-10 w-10 items-center justify-center transition hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-35"
        disabled={!canZoomOut}
        title="Zoom out"
        type="button"
        onClick={onZoomOut}
      >
        <ZoomIcon direction="out" />
      </button>
    </div>
  );
}
