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
      className="pointer-events-none absolute border border-[#0d99ff] bg-[#0d99ff]/10"
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
