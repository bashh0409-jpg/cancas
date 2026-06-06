type CanvasMarqueeSelectionProps = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export function CanvasMarqueeSelection({
  x,
  y,
  width,
  height,
}: CanvasMarqueeSelectionProps) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute border border-[#2244ec] bg-[#2244ec]/10"
      style={{
        height,
        left: x,
        top: y,
        width,
        zIndex: 9999,
      }}
    />
  );
}
