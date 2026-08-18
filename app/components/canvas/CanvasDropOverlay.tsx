type CanvasDropOverlayProps = {
  isVisible: boolean;
};

export function CanvasDropOverlay({ isVisible }: CanvasDropOverlayProps) {
  return (
    <div
      aria-hidden={!isVisible}
      className={[
        "pointer-events-none font mono uppercase tracking-tight mix-blend-difference left-15 absolute inset-4 z-30 grid place-items-center rounded border border-dashed text-sm font-medium text-white transition",
        isVisible
          ? "border-[#2244ec]/70 bg-[#2244ec]/10 opacity-100"
          : "border-white/0 bg-transparent opacity-0",
      ].join(" ")}
    >

      {/* Corner brackets define the drop area without visually blocking the canvas. */}{" "}
      <span className="absolute left-4 top-4 h-8 w-8 border-l border-t border-[#2244ec]" />{" "}
      <span className="absolute right-4 top-4 h-8 w-8 border-r border-t border-[#2244ec]" />{" "}
      <span className="absolute bottom-4 left-4 h-8 w-8 border-b border-l border-[#2244ec]" />{" "}
      <span className="absolute bottom-4 right-4 h-8 w-8 border-b border-r border-[#2244ec]" />
      Drop images onto the canvas
    </div>
  );
}
