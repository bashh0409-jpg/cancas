"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import MuxPlayer from "@mux/mux-player-react";
import type MuxPlayerElement from "@mux/mux-player";
import type { MuxCSSProperties } from "@mux/mux-player-react";
import {
  ArrowRight,
  SquarePause,
  Play,
  SquarePlay,
  Volume2,
  VolumeOff,
  Clapperboard,
  Fullscreen,
} from "lucide-react";
import { tutorials, type TutorialItem } from "./tutorialData";

type SelectedVideo = TutorialItem;

export default function Tutorials() {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<MuxPlayerElement | null>(null);

  const [canScrollRight, setCanScrollRight] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<SelectedVideo | null>(
    null,
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (!selectedVideo) return;

    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedVideo]);

  const handleScroll = () => {
    if (!scrollRef.current) return;

    scrollRef.current.scrollBy({ left: 240, behavior: "smooth" });
    const el = scrollRef.current;

    requestAnimationFrame(() => {
      setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 10);
    });
  };

  const openVideo = (video: SelectedVideo) => {
    setSelectedVideo(video);
    setIsLoaded(false);
    setIsPlaying(true);
    setIsMuted(false);
    setCurrentTime(0);
    setDuration(0);
  };

  const closeModal = () => {
    if (playerRef.current?.pause) {
      playerRef.current.pause();
    }
    setSelectedVideo(null);
    setIsPlaying(false);
    setIsLoaded(false);
    setCurrentTime(0);
    setDuration(0);
  };

  const togglePlay = () => {
    if (!playerRef.current) return;

    if (isPlaying) {
      playerRef.current.pause?.();
      setIsPlaying(false);
    } else {
      playerRef.current.play?.();
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (!playerRef.current) return;

    if (isMuted) {
      playerRef.current.muted = false;
      setIsMuted(false);
    } else {
      playerRef.current.muted = true;
      setIsMuted(true);
    }
  };

  const openFullscreen = () => {
    playerRef.current?.requestFullscreen?.();
  };

  const handleTimeUpdate = () => {
    if (!playerRef.current) return;
    setCurrentTime(playerRef.current.currentTime ?? 0);
    setDuration(playerRef.current.duration ?? 0);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <>
      <div className="mono rounded bg-white/10 p-3 text-xs text-white">
        <p className="mb-3 max-w-60 tracking-tight">
          Learn how to use the canvas with our step-by-step guides.
        </p>

        <div className="relative">
          <div
            ref={scrollRef}
            className="scrollbar-none flex gap-2 overflow-x-auto scroll-smooth"
          >
            {tutorials.map((video) => (
              <button
                key={video.id}
                type="button"
                onClick={() => openVideo(video)}
                className="group cursor-pointer relative aspect-video h-40 min-w-[200px] shrink-0 overflow-hidden rounded bg-white/10 text-left"
              >
                <Image
                  src={video.thumbnail}
                  alt={video.title}
                  fill
                  priority={false}
                  className="object-cover transition-transform duration-300"
                />

                <div className="absolute inset-0 bg-black/20 transition-colors group-hover:bg-black/40" />

                <div className="absolute left-2 bottom-2">
                  <p className="line-clamp-2 max-w-[160px] truncate text-[10px] font-medium tracking-tight text-white">
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
              aria-label="Scroll tutorials right"
              className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center justify-center rounded-xs bg-white text-black"
            >
              <ArrowRight className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

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

                <MuxPlayer
                  ref={playerRef}
                  playbackId={selectedVideo.playbackId}
                  metadata={{ video_title: selectedVideo.title }}
                  poster={selectedVideo.thumbnail}
                  autoPlay
                  muted={isMuted}
                  loop={true}
                  onCanPlay={() => setIsLoaded(true)}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onTimeUpdate={handleTimeUpdate}
                  className={`aspect-video mux w-full transition-opacity duration-300 ${isLoaded ? "opacity-100" : "opacity-0"}`}
                  style={
                    {
                      width: "100%",
                      height: "100%",
                      minHeight: 0,
                      minWidth: 0,
                      objectFit: "cover",
                      "--media-object-fit": "cover",
                      "--controls": "none",
                      "--media-control-display": "none",
                    } as MuxCSSProperties
                  }
                />

                <div className="pointer-events-none absolute inset-0 z-20" />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/80 to-transparent" />
              </div>
            </article>

            <div className="flex w-fit min-w-[340px] h-8 items-center justify-between gap-4 rounded border border-black/10 bg-white pl-3 shadow-2xl">
              <div
                className="min-w-0 gap-1 flex items-center cursor-pointer"
                onClick={closeModal}
              >
                <Clapperboard className="w-4 h-4 stroke-[1.5] text-black/70" />
                <span className="mono uppercase text-xs mx-2">
                  {duration > 0
                    ? `${formatTime(currentTime)}`
                    : "00:00"}
                </span>
                <span className="text-xs mono uppercase tracking-tight truncate">
                  {selectedVideo.title}
                </span>
              </div>

              <div className="flex items-center gap-1 rounded p-0.5">
                <button
                  type="button"
                  onClick={togglePlay}
                  className="rounded cursor-pointer p-1.5 text-black transition-colors hover:bg-white"
                >
                  {isPlaying ? (
                    <SquarePause className="h-4.5 stroke-[1.9] hover:text-black  text-black/70 w-4.5" />
                  ) : (
                    <SquarePlay className="stroke-[1.9] hover:text-black text-black/70 h-4.5 w-4.5" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={toggleMute}
                  className="rounded cursor-pointer stroke-[1.5] text-black/70 p-1.5 text-black transition-colors hover:bg-white"
                >
                  {isMuted ? (
                    <VolumeOff className="h-4.5 stroke-[1.9] hover:text-black  text-black/70 w-4.5" />
                  ) : (
                    <Volume2 className="h-4.5 stroke-[1.9] hover:text-black text-black/70 w-4.5" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={openFullscreen}
                  className="rounded cursor-pointer p-1.5 text-black transition-colors hover:bg-white"
                >
                  <Fullscreen className="h-4 stroke-[1.9] hover:text-black  text-black/70 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
