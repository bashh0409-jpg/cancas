"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import MuxPlayer from "@mux/mux-player-react";

type Props = {
  open: boolean;
  onClose: () => void;
  src?: string;
};

/**
 * ReflowDemoModal — full-screen modal that plays the Reflow demo video.
 * Uses Mux for streaming (consistent with the rest of the app).
 */
export default function ReflowDemoModal({
  open,
  onClose,
  src = "https://player.mux.com/velHpMwVI0000UWC2mG1UTfmcS7G901H8kgIyJqJB79bjo?metadata-video-title=Reflow-Demo",
}: Props) {
  // Lock body scroll while open
  useEffect(() => {
    if (!open) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleEsc);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Reflow demo video"
    >
      <div
        className="relative flex aspect-video w-full max-w-5xl flex-col overflow-hidden rounded bg-black shadow-[0_32px_100px_rgba(0,0,0,0.5)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close demo"
          className="absolute right-3 top-3 z-10 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md transition-all duration-200 hover:bg-black/80 hover:scale-105"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Mux video player */}
        <MuxPlayer
          src={src}
          autoPlay
          loop
          muted
          className="h-full w-full"
          metadata={{ video_title: "Reflow Demo" }}
        />
      </div>
    </div>
  );
}