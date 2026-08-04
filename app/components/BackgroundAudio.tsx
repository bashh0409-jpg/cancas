"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Play, ChevronLast, AudioLines } from "lucide-react";
import gsap from "gsap";

/**
 * BackgroundAudio — floating mute/unmute toggle for ambient background audio.
 *
 * Audio files are hosted on Supabase Storage:
 *   https://okgjifzweuehbcxrohmh.supabase.co/storage/v1/object/public/audio/
 *
 * - Tracks alternate automatically when one ends.
 * - A "next track" button lets users skip to the other song.
 * - The pulsing ring fires on every detected bass beat via GSAP.
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

/** Minimum gap between two pulses (ms) — avoids over-firing on sustained bass */
const MIN_BEAT_GAP_MS = 0;

export default function BackgroundAudio() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [trackIndex, setTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(
    () =>
      typeof window !== "undefined" &&
      localStorage.getItem("reflow-bg-audio") === "playing"
  );

  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioSourceBound = useRef(false);
  const isPlayingRef = useRef(false);
  const pulseRef = useRef<HTMLSpanElement | null>(null);
  const lastBeatTime = useRef(0);

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

  // Beat detection — fires the pulse ring on energy spikes across the
  // FULL frequency spectrum (bass, mids, highs) so it tracks the overall
  // rhythm — kicks, snares, hi-hats, and other instruments.
  // Uses refs + GSAP directly, so NO React re-renders happen per beat.
  useEffect(() => {
    let raf = 0;
    const history: number[] = [];
    const data = new Uint8Array(128);

    const detectBeat = () => {
      const analyser = analyserRef.current;
      if (analyser && isPlayingRef.current) {
        analyser.getByteFrequencyData(data);

        // Weighted full-spectrum energy:
        // - Bass (bins 1–15) gets the highest weight (kick drums)
        // - Mids (bins 16–60) get medium weight (snares, vocals, synths)
        // - Highs (bins 61–127) get lower weight (hi-hats, cymbals)
        let weightedEnergy = 0;
        for (let i = 1; i < 128; i++) {
          const v = data[i];
          if (i < 16) {
            weightedEnergy += v * 1.6; // bass — kick drums
          } else if (i < 61) {
            weightedEnergy += v * 1.0; // mids — snares, synths
          } else {
            weightedEnergy += v * 0.5; // highs — hats, cymbals
          }
        }
        const energyAvg = weightedEnergy / 127;

        history.push(energyAvg);
        if (history.length > 43) history.shift(); // ~0.7s of frames

        if (history.length >= 10) {
          const baseline =
            history.reduce((a, b) => a + b, 0) / history.length;

          // A beat is a sharp energy spike above the running average
          if (energyAvg > baseline * 1.25 && energyAvg > 30) {
            const now = performance.now();

            // Enforce a minimum gap between pulses so sustained energy
            // doesn't fire multiple pulses for the same beat
            if (now - lastBeatTime.current >= MIN_BEAT_GAP_MS) {
              lastBeatTime.current = now;

              // Fire the pulse ring directly via GSAP — follows the beat
              const pulse = pulseRef.current;
              if (pulse) {
                gsap.killTweensOf(pulse);
                gsap.fromTo(
                  pulse,
                  { scale: 0.6, opacity: 0.8 },
                  {
                    scale: 2.2,
                    opacity: 0,
                    duration: 0.45,
                    ease: "power2.out",
                  },
                );
              }
            }
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

  return (
    <>
      <audio
        ref={audioRef}
        src={TRACKS[trackIndex]}
        preload="auto"
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

      {/* Pulse ring — triggered directly by GSAP on each detected beat.
          Static element, positioned with transform so GSAP scale works. */}
      <span
        ref={pulseRef}
        className="pointer-events-none fixed bottom-7 right-8 z-[199] h-6 w-11 -translate-x-0 rounded-full border border-white/40 opacity-0"
      />
    </>
  );
}