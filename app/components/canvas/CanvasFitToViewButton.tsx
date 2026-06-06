import { Maximize2 } from "lucide-react";

type CanvasFitToViewButtonProps = {
  onClick: () => void;
};

export function CanvasFitToViewButton({ onClick }: CanvasFitToViewButtonProps) {
  return (
    <div
      className="absolute right-4 top-1/2 z-40 -translate-y-1/2"
      onWheel={(event) => event.stopPropagation()}
    >
      <button
        aria-label="Fit all content to view"
        className={[
          "flex h-9 w-9 items-center justify-center rounded-xl",
          "border border-black/10 bg-white/95",
          "text-black/60 shadow-[0_10px_30px_rgba(0,0,0,0.10)]",
          "backdrop-blur-xl transition",
          "hover:bg-white hover:text-black",
        ].join(" ")}
        title="Fit all content to view"
        type="button"
        onClick={onClick}
      >
        <Maximize2 className="h-4 w-4" />
      </button>
    </div>
  );
}
