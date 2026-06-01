type CanvasFitToViewButtonProps = {
  onClick: () => void;
};

export function CanvasFitToViewButton({ onClick }: CanvasFitToViewButtonProps) {
  return (
    <div
      className="absolute right-4 top-1/2 z-40 -translate-y-1/2 text-white"
      onWheel={(event) => event.stopPropagation()}
    >
      <button
        aria-label="Fit all content to view"
        className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-zinc-950/90 text-white/75 shadow-[0_12px_32px_rgba(0,0,0,0.38)] backdrop-blur transition hover:bg-zinc-900 hover:text-white"
        title="Fit all content to view"
        type="button"
        onClick={onClick}
      >
        <svg
          aria-hidden
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5M7 12h10M12 7v10"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.7"
          />
        </svg>
      </button>
    </div>
  );
}
