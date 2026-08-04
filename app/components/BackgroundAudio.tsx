"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

/**
 * BackgroundAudio — floating mute/unmute toggle for ambient background audio.
 *
 * Audio file expected at: /audio/background.mp3
 * - Autoplay is blocked by browsers, so the button acts as the first user gesture.
 * - State is persisted in localStorage so the choice survives reloads.
 */
export default function BackgroundAudio() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(
    () =>
      typeof window !== "undefined" &&
      localStorage.getItem("reflow-bg-audio") === "playing"
  );
  const [isReady, setIsReady] = useState(false);

  // Restore playback if user previously enabled audio
  useEffect(() => {
    if (isPlaying) {
      audioRef.current?.play().catch(() => {
        setIsPlaying(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady]);

  // Persist state
  useEffect(() => {
    localStorage.setItem("reflow-bg-audio", isPlaying ? "playing" : "muted");
  }, [isPlaying]);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      // First gesture — browsers allow playback after user interaction
      audio.volume = 0.35;
      audio.play().catch(() => {
        setIsPlaying(false);
      });
      setIsPlaying(true);
    }
  };

  return (
    <>
      <audio
        ref={audioRef}
        src="/audio/background.mp3"
        loop
        preload="auto"
        onCanPlay={() => setIsReady(true)}
        onError={() => setIsReady(false)}
      />

      {/* Floating control — bottom-right, above the footer */}
      <button
        type="button"
        onClick={toggle}
        aria-label={isPlaying ? "Mute background audio" : "Play background audio"}
        title={isPlaying ? "Mute" : "Play"}
        className={`fixed bottom-6 right-6 z-[200] flex h-11 w-11 items-center justify-center rounded-full border backdrop-blur-md transition-all duration-300 ${
          isPlaying
            ? "border-white/20 bg-black/40 text-white"
            : "border-white/10 bg-black/20 text-white/60 hover:text-white"
        }`}
      >
        {isPlaying ? (
          <Volume2 className="h-5 w-5" />
        ) : (
          <VolumeX className="h-5 w-5" />
        )}
      </button>

      {/* Pulsing ring when playing — subtle indicator */}
      {isPlaying && (
        <span className="pointer-events-none fixed bottom-6 right-6 z-[199] h-11 w-11 rounded-full border border-white/20 animate-ping" />
      )}
    </>
  );
}