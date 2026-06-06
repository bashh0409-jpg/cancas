type CanvasDropOverlayProps = {
  isVisible: boolean;
};

export function CanvasDropOverlay({ isVisible }: CanvasDropOverlayProps) {
  return (
    <div
      aria-hidden={!isVisible}
      className={[
        "pointer-events-none absolute inset-4 z-30 grid place-items-center rounded-xl border border-dashed text-sm font-medium text-white transition",
        isVisible
          ? "border-[#2244ec]/70 bg-[#2244ec]/10 opacity-100"
          : "border-white/0 bg-transparent opacity-0",
      ].join(" ")}
    >
      Drop images onto the canvas
    </div>
  );
}
