"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX, SkipForward } from "lucide-react";

/**
 * BackgroundAudio — floating mute/unmute toggle for ambient background audio.
 *
 * Audio files expected at:
 *   /audio/background-1.mp3
 *   /audio/background-2.mp3
 *
 * - Tracks alternate automatically when one ends.
 * - A "next track" button lets users skip to the other song.
 * - Autoplay is blocked by browsers, so the button acts as the first user gesture.
 * - State is persisted in localStorage so the choice survives reloads.
 */

const TRACKS = ["/audio/background.mp3", "/audio/background-2.mp3"];

export default function BackgroundAudio() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [trackIndex, setTrackIndex] = useState(0);
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

  // When a track ends, switch to the other one
  const handleTrackEnd = () => {
    setTrackIndex((prev) => (prev + 1) % TRACKS.length);
    // Play the new track after React updates the src
    setTimeout(() => {
      audioRef.current?.play().catch(() => setIsPlaying(false));
    }, 50);
  };

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

  const skipTrack = () => {
    const audio = audioRef.current;
    if (!audio) return;

    setTrackIndex((prev) => (prev + 1) % TRACKS.length);
    if (isPlaying) {
      setTimeout(() => {
        audioRef.current?.play().catch(() => setIsPlaying(false));
      }, 50);
    }
  };

  return (
    <>
      <audio
        ref={audioRef}
        src={TRACKS[trackIndex]}
        loop={false}
        preload="auto"
        onCanPlay={() => setIsReady(true)}
        onError={() => setIsReady(false)}
        onEnded={handleTrackEnd}
      />

      {/* Floating controls — bottom-right, above the footer */}
      <div className="fixed bottom-6 right-6 z-[200] flex items-center gap-2">
        {/* Skip track button */}
        <button
          type="button"
          onClick={skipTrack}
          aria-label="Next track"
          title="Next track"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/20 text-white/60 backdrop-blur-md transition-all duration-300 hover:text-white"
        >
          <SkipForward className="h-5 w-5" />
        </button>

        {/* Play / mute button */}
        <button
          type="button"
          onClick={toggle}
          aria-label={isPlaying ? "Mute background audio" : "Play background audio"}
          title={isPlaying ? "Mute" : "Play"}
          className={`flex h-11 w-11 items-center justify-center rounded-full border backdrop-blur-md transition-all duration-300 ${
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
      </div>

      {/* Pulsing ring when playing — subtle indicator */}
      {isPlaying && (
        <span className="pointer-events-none fixed bottom-6 right-6 z-[199] h-11 w-11 rounded-full border border-white/20 animate-ping" />
      )}
    </>
  );
}