"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { Play, ChevronLast, AudioLines } from "lucide-react";

/**
 * BackgroundAudio — floating mute/unmute toggle for ambient background audio.
 *
 * Audio files are hosted on Supabase Storage:
 *   https://okgjifzweuehbcxrohmh.supabase.co/storage/v1/object/public/audio/
 *
 * - Tracks alternate automatically when one ends.
 * - A "next track" button lets users skip to the other song.
 * - The pulsing ring is synced to the music's beat via Web Audio API.
 * - Autoplay is blocked by browsers, so the button acts as the first user gesture.
 * - State is persisted in localStorage so the choice survives reloads.
 */

const SUPABASE_URL = "https://okgjifzweuehbcxrohmh.supabase.co";
const STORAGE_PATH = "/storage/v1/object/public/audio";

const TRACKS = [
  `${SUPABASE_URL}${STORAGE_PATH}/background.mp3`,
  `${SUPABASE_URL}${STORAGE_PATH}/Reflow.mp3`,
  `${SUPABASE_URL}${STORAGE_PATH}/background-2.mp3`,
];

const HIDDEN_PATHS = ["/", "/signin"];

export default function BackgroundAudio() {
  const pathname = usePathname();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [trackIndex, setTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(
    () =>
      typeof window !== "undefined" &&
      localStorage.getItem("reflow-bg-audio") === "playing"
  );
  const [beatCount, setBeatCount] = useState(0);

  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioSourceBound = useRef(false);
  const isPlayingRef = useRef(false);

  // Keep ref in sync with state (called in effect, not render)
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Set up Web Audio API analyser once (bind source to audio element)
  const setupAnalyser = useCallback(async () => {
    if (audioSourceBound.current) return true;
    const audio = audioRef.current;
    if (!audio) return false;

    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return true; // No analyser support — audio still plays natively

    try {
      const ctx = new AudioCtx();
      const source = ctx.createMediaElementSource(audio);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.5;
      source.connect(analyser);
      analyser.connect(ctx.destination);
      analyserRef.current = analyser;
      audioCtxRef.current = ctx;
      audioSourceBound.current = true;

      // Resume must complete BEFORE play() — otherwise audio is silent
      if (ctx.state === "suspended") {
        await ctx.resume();
      }
      return true;
    } catch {
      // Source already bound or error — audio still plays natively
      return true;
    }
  }, []);

  // Play/pause whenever isPlaying or trackIndex changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      const play = async () => {
        await setupAnalyser();
        try {
          audio.volume = 0.95;
          await audio.play();
        } catch {
          setIsPlaying(false);
        }
      };
      play();
    } else {
      audio.pause();
    }
  }, [isPlaying, trackIndex, setupAnalyser]);

  // Persist state
  useEffect(() => {
    localStorage.setItem("reflow-bg-audio", isPlaying ? "playing" : "muted");
  }, [isPlaying]);

  // Beat detection — track bass energy spikes and trigger ping per beat
  useEffect(() => {
    let raf = 0;
    const history: number[] = [];
    const data = new Uint8Array(128);

    const detectBeat = () => {
      const analyser = analyserRef.current;
      if (analyser && isPlayingRef.current) {
        analyser.getByteFrequencyData(data);

        // Sum low-frequency (bass) energy — bins 1–15 ≈ 20–250 Hz at 44.1 kHz
        let bassSum = 0;
        for (let i = 1; i < 15; i++) bassSum += data[i];
        const bassAvg = bassSum / 14;

        history.push(bassAvg);
        if (history.length > 43) history.shift(); // ~0.7s of frames

        if (history.length >= 10) {
          const baseline =
            history.reduce((a, b) => a + b, 0) / history.length;
          // A beat is a bass spike above the running average
          if (bassAvg > baseline * 1.35 && bassAvg > 40) {
            setBeatCount((c) => c + 1);
          }
        }
      }
      raf = requestAnimationFrame(detectBeat);
    };

    raf = requestAnimationFrame(detectBeat);
    return () => cancelAnimationFrame(raf);
  }, []);

  // When a track ends, switch to the other one
  const handleTrackEnd = () => {
    setTrackIndex((prev) => (prev + 1) % TRACKS.length);
  };

  const toggle = () => {
    setIsPlaying((prev) => !prev);
  };

  const skipTrack = () => {
    setTrackIndex((prev) => (prev + 1) % TRACKS.length);
  };

  // Don't render on home or signin pages
  if (HIDDEN_PATHS.includes(pathname)) return null;

  return (
    <>
      <audio
        ref={audioRef}
        src={TRACKS[trackIndex]}
        preload="auto"
        onCanPlay={() => {
          // Nothing needed here — play effect handles it
        }}
        onEnded={handleTrackEnd}
        crossOrigin="anonymous"
      />

      {/* Floating controls — bottom-right, above the footer */}
      <div className="fixed bottom-6 right-6 z-[200] flex items-center gap-1 rounded-full border border-white/15 bg-black/30 p-1 backdrop-blur-md transition-all duration-300">
        {/* Play / mute button */}
        <button
          type="button"
          onClick={toggle}
          aria-label={
            isPlaying ? "Mute background audio" : "Play background audio"
          }
          title={isPlaying ? "Mute" : "Play"}
          className={`flex cursor-pointer h-6 w-6 items-center justify-center rounded-full border transition-all duration-300 ${
            isPlaying
              ? "border-black/10 bg-white text-black"
              : "border-black/10 bg-white text-black hover:bg-black hover:text-white"
          }`}
        >
          {isPlaying ? (
            <AudioLines className="h-4 w-4" />
          ) : (
            <Play className="h-4 fill-black w-4" />
          )}
        </button>

        {/* Skip track button */}
        <button
          type="button"
          onClick={skipTrack}
          aria-label="Next track"
          title="Next track"
          className="flex cursor-pointer h-6 w-6 items-center justify-center rounded-full border border-black/10 bg-white text-black transition-all duration-300 hover:bg-black hover:text-white"
        >
          <ChevronLast className="h-4 w-4" />
        </button>
      </div>

      {/* Pulsing ring synced to bass beats — remounts on each detected beat */}
      {isPlaying && (
        <span
          key={beatCount}
          className="pointer-events-none fixed mix-blend-difference bottom-7 right-8 z-[199] h-6 w-11 rounded-full border border-white/40 animate-ping [animation-duration:450ms]"
        />
      )}
    </>
  );
}