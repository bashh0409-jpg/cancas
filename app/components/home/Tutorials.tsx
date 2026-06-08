"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Maximize,
  Pause,
  Play,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";

const tutorials = [
  {
    title: "Cinematic Portfolio Breakdown",
    videoId: "LcxREB8BL8c",
    thumbnail: "https://i.ytimg.com/vi/LcxREB8BL8c/maxresdefault.jpg",
  },
  {
    title: "Creative Studio Website Process",
    videoId: "E2iMwzwPJCw",
    thumbnail: "https://i.ytimg.com/vi/E2iMwzwPJCw/maxresdefault.jpg",
  },
  {
    title: "Modern Motion Design Workflow",
    videoId: "_v40ddCwrQg",
    thumbnail: "https://i.ytimg.com/vi/_v40ddCwrQg/maxresdefault.jpg",
  },
  {
    title: "Designing Premium Experiences",
    videoId: "dtSbMGzi2lQ",
    thumbnail: "https://i.ytimg.com/vi/dtSbMGzi2lQ/maxresdefault.jpg",
  },
  {
    title: "Building Interactive Interfaces",
    videoId: "XEUzDdypXc8",
    thumbnail: "https://i.ytimg.com/vi/XEUzDdypXc8/maxresdefault.jpg",
  },
  {
    title: "Creative Direction & Motion",
    videoId: "n8PtYmpDixU",
    thumbnail: "https://i.ytimg.com/vi/n8PtYmpDixU/maxresdefault.jpg",
  },
  {
    title: "Immersive Website Storytelling",
    videoId: "fvy6fQbnMYQ",
    thumbnail: "https://i.ytimg.com/vi/fvy6fQbnMYQ/maxresdefault.jpg",
  },
  {
    title: "Advanced UI Animation Concepts",
    videoId: "O238WIpdKbs",
    thumbnail: "https://i.ytimg.com/vi/O238WIpdKbs/maxresdefault.jpg",
  },
  {
    title: "High-End Visual Design Systems",
    videoId: "DVnJqq1vx-Q",
    thumbnail: "https://i.ytimg.com/vi/DVnJqq1vx-Q/maxresdefault.jpg",
  },
  {
    title: "Designing Interactive Motion",
    videoId: "FZPRgrP_s4E",
    thumbnail: "https://i.ytimg.com/vi/FZPRgrP_s4E/maxresdefault.jpg",
  },
  {
    title: "Creative Development Deep Dive",
    videoId: "KaKJM3YaePA",
    thumbnail: "https://i.ytimg.com/vi/KaKJM3YaePA/maxresdefault.jpg",
  },
];

type SelectedVideo = {
  title: string;
  videoId: string;
};

function sendYTCommand(
  iframe: HTMLIFrameElement,
  func: string,
  args: unknown[] = [],
) {
  iframe.contentWindow?.postMessage(
    JSON.stringify({
      event: "command",
      func,
      args,
    }),
    "*",
  );
}

export default function Tutorials() {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const [canScrollRight, setCanScrollRight] = useState(true);

  const [selectedVideo, setSelectedVideo] = useState<SelectedVideo | null>(
    null,
  );

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  /* =========================
     LOCK BACKGROUND SCROLL
  ========================== */
  useEffect(() => {
    if (!selectedVideo) return;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedVideo]);

  /* =========================
     PLAYER STATE SYNC
  ========================== */
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      try {
        const data = typeof e.data === "string" ? JSON.parse(e.data) : e.data;

        if (
          data?.event === "infoDelivery" &&
          data?.info?.playerState !== undefined
        ) {
          setIsPlaying(data.info.playerState === 1);
        }
      } catch {
        // Ignore non-YouTube messages
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  /* =========================
     SCROLL
  ========================== */
  const handleScroll = () => {
    if (!scrollRef.current) return;

    scrollRef.current.scrollBy({
      left: 240,
      behavior: "smooth",
    });

    const el = scrollRef.current;

    requestAnimationFrame(() => {
      setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 10);
    });
  };

  /* =========================
     OPEN VIDEO
  ========================== */
  const openVideo = (video: SelectedVideo) => {
    setSelectedVideo(video);

    setIsLoaded(false);
    setIsPlaying(true);
    setIsMuted(false);
  };

  /* =========================
     CLOSE MODAL
  ========================== */
  const closeModal = () => {
    if (iframeRef.current) {
      sendYTCommand(iframeRef.current, "pauseVideo");
    }

    setSelectedVideo(null);
    setIsPlaying(false);
    setIsLoaded(false);
  };

  /* =========================
     PLAY / PAUSE
  ========================== */
  const togglePlay = () => {
    if (!iframeRef.current) return;

    if (isPlaying) {
      sendYTCommand(iframeRef.current, "pauseVideo");
      setIsPlaying(false);
    } else {
      sendYTCommand(iframeRef.current, "playVideo");
      setIsPlaying(true);
    }
  };

  /* =========================
     MUTE
  ========================== */
  const toggleMute = () => {
    if (!iframeRef.current) return;

    if (isMuted) {
      sendYTCommand(iframeRef.current, "unMute");
      setIsMuted(false);
    } else {
      sendYTCommand(iframeRef.current, "mute");
      setIsMuted(true);
    }
  };

  /* =========================
     FULLSCREEN
  ========================== */
  const openFullscreen = () => {
    if (!iframeRef.current) return;

    iframeRef.current.requestFullscreen?.();
  };

  /* =========================
     EMBED URL
     origin fixes API issues
  ========================== */
const buildEmbedUrl = (videoId: string) => {
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  return `https://www.youtube.com/embed/${videoId}?enablejsapi=1&autoplay=1&mute=0&controls=0&rel=0&modestbranding=1&playsinline=1&origin=${origin}`;
};

  return (
    <>
      {/* =========================
          TUTORIAL STRIP
      ========================== */}
      <div className="mono rounded-md bg-white/10 p-3 text-xs text-white">
        <p className="mb-3 max-w-60 tracking-tight">
          Learn how to use the canvas with our step-by-step guides.
        </p>

        <div className="relative">
          <div
            ref={scrollRef}
            className="scrollbar-none flex gap-2 overflow-x-auto pr-14"
          >
            {tutorials.map((video, i) => (
              <button
                key={i}
                type="button"
                onClick={() => openVideo(video)}
                className="group relative aspect-video h-40 min-w-[200px] shrink-0 overflow-hidden rounded bg-white/10 text-left"
              >
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="h-full w-full object-cover transition-transform duration-300"
                />

                <div className="absolute inset-0 bg-black/20 transition-colors group-hover:bg-black/40" />

                <div className="absolute left-2 bottom-2">
                  <p className="line-clamp-2 max-w-[160px] trancate text-[10px] font-medium tracking-tight text-white">
                    {video.title}
                  </p>
                </div>

                <div className="absolute bottom-2 right-2 flex h-6 w-6 items-center justify-center rounded-xs bg-white text-black">
                  <Play className="ml-0.5 h-3 w-3 fill-black" />
                </div>
              </button>
            ))}
          </div>

          {canScrollRight && (
            <button
              type="button"
              onClick={handleScroll}
              className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center justify-center bg-white text-black"
            >
              <ArrowRight className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* =========================
          VIDEO MODAL
      ========================== */}
      {selectedVideo && (
        <div
          className="fixed inset-0 z-[999] grid place-items-center bg-black p-4 backdrop-blur-md sm:p-8"
          onClick={closeModal}
          role="presentation"
        >
          <div
            className="flex w-full max-w-5xl flex-col items-center gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* =========================
                VIDEO CARD
            ========================== */}
            <article
              className="flex w-full flex-col overflow-hidden rounded border border-black bg-[#111] shadow-[0_32px_100px_rgba(0,0,0,0.45)]"
              role="dialog"
              aria-modal="true"
            >
              <div className="relative overflow-hidden bg-black">
                {!isLoaded && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#111]">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                  </div>
                )}

                <iframe
                  ref={iframeRef}
                  src={buildEmbedUrl(selectedVideo.videoId)}
                  title={selectedVideo.title}
                  className={`aspect-video w-full transition-opacity duration-300 ${
                    isLoaded ? "opacity-100" : "opacity-0"
                  }`}
                  allow="autoplay; fullscreen; encrypted-media"
                  allowFullScreen
                  onLoad={() => setIsLoaded(true)}
                />

                {/* Prevent YouTube hover overlays */}
                <div className="pointer-events-none absolute inset-0 z-20" />

                {/* Bottom gradient */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/80 to-transparent" />
              </div>
            </article>

            {/* =========================
                FLOATING TOOLBAR
            ========================== */}
            <div className="flex w-fit min-w-[340px] items-center justify-between gap-4 rounded border border-black/10 bg-white p-0.5 pl-3 shadow-2xl">
              <div className="min-w-0">
                <span className="truncate text-[13px] font-medium tracking-tight text-black">
                  {selectedVideo.title}
                </span>
              </div>

              <div className="flex items-center gap-1 rounded bg-black/10 p-0.5">
                {/* Play */}
                <button
                  type="button"
                  onClick={togglePlay}
                  className="rounded-md p-1.5 text-black transition-colors hover:bg-white"
                >
                  {isPlaying ? (
                    <Pause className="h-4.5 w-4.5 fill-black" />
                  ) : (
                    <Play className="ml-0.5 h-4.5 w-4.5 fill-black" />
                  )}
                </button>

                {/* Mute */}
                <button
                  type="button"
                  onClick={toggleMute}
                  className="rounded-md p-1.5 text-black transition-colors hover:bg-white"
                >
                  {isMuted ? (
                    <VolumeX className="h-4.5 w-4.5" />
                  ) : (
                    <Volume2 className="h-4.5 w-4.5" />
                  )}
                </button>

                {/* Fullscreen */}
                <button
                  type="button"
                  onClick={openFullscreen}
                  className="rounded-md p-1.5 text-black transition-colors hover:bg-white"
                >
                  <Maximize className="h-4.5 w-4.5" />
                </button>

                {/* Close */}
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-md p-1.5 text-black transition-colors hover:bg-white"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
