type CanvasLoadingOverlayProps = {
  isVisible: boolean;
};

export function CanvasLoadingOverlay({ isVisible }: CanvasLoadingOverlayProps) {
  if (!isVisible) {
    return null;
  }

  return (
    <div
      aria-label="Loading canvas"
      aria-live="polite"
      className="fixed inset-0 z-[100] grid place-items-center bg-black"
      role="status"
    >
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/25 border-t-white" />
    </div>
  );
}
