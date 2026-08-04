"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Volume2, VolumeX, SkipForward, Play, ChevronLast, ChevronLast } from "lucide-react";

/**
 * BackgroundAudio — floating mute/unmute toggle for ambient background audio.
 *
 * Audio files expected at:
 *   /audio/background.mp3
 *   /audio/Reflow.mp3
 *   /audio/background-2.mp3
 *
 * - Tracks alternate automatically when one ends.
 * - A "next track" button lets users skip to the other song.
 * - The pulsing ring is synced to the music's beat via Web Audio API.
 * - Autoplay is blocked by browsers, so the button acts as the first user gesture.
 * - State is persisted in localStorage so the choice survives reloads.
 */

const TRACKS = [
  "/audio/background.mp3",
  "/audio/Reflow.mp3",
  "/audio/background-2.mp3",
];

export default function BackgroundAudio() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [trackIndex, setTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(
    () =>
      typeof window !== "undefined" &&
      localStorage.getItem("reflow-bg-audio") === "playing"
  );
  const [isReady, setIsReady] = useState(false);
  const [beatCount, setBeatCount] = useState(0);

  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioSourceBound = useRef(false);
  const isPlayingRef = useRef(isPlaying);

  // Keep ref in sync with state (called in effect, not render)
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Set up Web Audio API analyser once (bind source to audio element)
  const setupAnalyser = useCallback(() => {
    if (audioSourceBound.current) return;
    const audio = audioRef.current;
    if (!audio) return;

    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;

    try {
      const ctx = new AudioCtx();
      const source = ctx.createMediaElementSource(audio);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      analyser.connect(ctx.destination);
      analyserRef.current = analyser;
      audioSourceBound.current = true;
      ctx.resume();
    } catch {
      // Source already bound — fall back to static ping
    }
  }, []);

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

  // Restore playback if user previously enabled audio
  useEffect(() => {
    if (isPlaying) {
      setupAnalyser();
      audioRef.current?.play().catch(() => {
        setIsPlaying(false);
      });
    }
  }, [isReady, setupAnalyser]);

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
      setupAnalyser();
      audio.volume = 0.95;
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
      <div className="fixed mix-blend-difference bottom-6 right-6 z-[200] flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1 backdrop-blur-md transition-all duration-300">
        {/* Skip track button */}
        <button
          type="button"
          onClick={skipTrack}
          aria-label="Next track"
          title="Next track"
          className="flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-white text-black mix-blend-difference transition-all duration-300 "
        >
          <ChevronLast className="h-4 w-4" />
        </button>

        {/* Play / mute button */}
        <button
          type="button"
          onClick={toggle}
          aria-label={
            isPlaying ? "Mute background audio" : "Play background audio"
          }
          title={isPlaying ? "Mute" : "Play"}
          className={`flex h-6 w-6 items-center justify-center rounded-full border backdrop-blur-md transition-all duration-300 ${
            isPlaying
              ? "border-white/20 bg-white text-black"
              : "border-white/10 bg-white text-black hover:text-black"
          }`}
        >
          {isPlaying ? (
            <Volume2 className="h-4 w-4" />
          ) : (
            <VolumeX className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Pulsing ring synced to bass beats — remounts on each detected beat */}
      {isPlaying && (
        <span
          key={beatCount}
          className="pointer-events-none fixed bottom-7 right-8 z-[199] h-6 w-11 rounded-full border border-white/20 animate-ping [animation-duration:400ms]"
        />
      )}
    </>
  );
}