"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  formatVoiceDuration,
  getVoiceWaveformHeights,
} from "@/lib/canvas/voiceNoteUtils";
import {
  VoiceNoteOptionsMenu,
  type VoiceNoteMenuAction,
} from "./VoiceNoteOptionsMenu";
import { VoiceNotePlayPauseButton } from "./VoiceNotePlayPauseButton";
import { VoiceNoteWaveform } from "./VoiceNoteWaveform";

type VoiceNoteCardProps = {
  title: string;
  audioDataUrl: string;
  durationMs: number;
  playbackMs: number;
  isPlaying: boolean;
  isMenuOpen: boolean;
  onToggleMenu: () => void;
  onMenuAction: (action: VoiceNoteMenuAction) => void;
  onTogglePlayback: () => void;
  onAudioRef: (element: HTMLAudioElement | null) => void;
  onAudioEnded: () => void;
  onAudioPaused: () => void;
  onAudioPlaying: () => void;
  onAudioTimeUpdate: (playbackMs: number) => void;
};

const WAVEFORM_BAR_COUNT = getVoiceWaveformHeights().length;

type WindowWithAudioContextFallback = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext;
  };

export function VoiceNoteCard({
  title,
  audioDataUrl,
  durationMs,
  playbackMs,
  isPlaying,
  isMenuOpen,
  onToggleMenu,
  onMenuAction,
  onTogglePlayback,
  onAudioRef,
  onAudioEnded,
  onAudioPaused,
  onAudioPlaying,
  onAudioTimeUpdate,
}: VoiceNoteCardProps) {
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const frequencyDataRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const [waveformLevels, setWaveformLevels] = useState<number[]>(
    getVoiceWaveformHeights,
  );

  const stopWaveformAnalysis = useCallback(() => {
    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    setWaveformLevels(getVoiceWaveformHeights());
  }, []);

  const startWaveformAnalysis = useCallback(() => {
    const audioElement = audioElementRef.current;

    if (!audioElement || typeof window === "undefined") {
      return;
    }

    const AudioContextConstructor =
      window.AudioContext ??
      (window as WindowWithAudioContextFallback).webkitAudioContext;

    if (!AudioContextConstructor) {
      return;
    }

    const audioContext =
      audioContextRef.current ?? new AudioContextConstructor();
    audioContextRef.current = audioContext;

    const analyser = analyserRef.current ?? audioContext.createAnalyser();
    analyser.fftSize = 64;
    analyser.smoothingTimeConstant = 0.72;
    analyserRef.current = analyser;

    if (!sourceRef.current) {
      const source = audioContext.createMediaElementSource(audioElement);
      source.connect(analyser);
      analyser.connect(audioContext.destination);
      sourceRef.current = source;
    }

    frequencyDataRef.current = new Uint8Array(analyser.frequencyBinCount);

    if (audioContext.state === "suspended") {
      void audioContext.resume();
    }

    function readFrequencyData() {
      const currentAnalyser = analyserRef.current;
      const frequencyData = frequencyDataRef.current;

      if (!currentAnalyser || !frequencyData) {
        return;
      }

      currentAnalyser.getByteFrequencyData(frequencyData);

      const nextLevels = Array.from(
        { length: WAVEFORM_BAR_COUNT },
        (_, index) => {
          const bucketStart = Math.floor(
            (index / WAVEFORM_BAR_COUNT) * frequencyData.length,
          );
          const bucketEnd = Math.max(
            bucketStart + 1,
            Math.floor(
              ((index + 1) / WAVEFORM_BAR_COUNT) * frequencyData.length,
            ),
          );
          let total = 0;

          for (
            let bucketIndex = bucketStart;
            bucketIndex < bucketEnd;
            bucketIndex += 1
          ) {
            total += frequencyData[bucketIndex] ?? 0;
          }

          const average = total / (bucketEnd - bucketStart);
          return Math.max(18, Math.min(100, 18 + (average / 255) * 82));
        },
      );

      setWaveformLevels(nextLevels);
      animationFrameRef.current =
        window.requestAnimationFrame(readFrequencyData);
    }

    if (animationFrameRef.current === null) {
      readFrequencyData();
    }
  }, []);

  useEffect(() => {
    if (isPlaying) {
      startWaveformAnalysis();
      return;
    }

    stopWaveformAnalysis();
  }, [isPlaying, startWaveformAnalysis, stopWaveformAnalysis]);

  useEffect(() => {
    return () => {
      stopWaveformAnalysis();
      void audioContextRef.current?.close();
    };
  }, [stopWaveformAnalysis]);

  const handleAudioRef = useCallback(
    (element: HTMLAudioElement | null) => {
      audioElementRef.current = element;
      onAudioRef(element);
    },
    [onAudioRef],
  );

  return (
    <div
      className="relative h-fit w-full rounded border border-white/10 bg-white px-3  shadow-[0_10px_24px_rgba(0,0,0,0.35)] "
      style={{ mixBlendMode: "multiply" }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="mono truncate text-xs tracking-tight text-black/" title={title}>
          {title}
        </span>
        <VoiceNoteOptionsMenu
          isOpen={isMenuOpen}
          onAction={onMenuAction}
          onToggle={onToggleMenu}
        />
      </div>

      <div
        className="flex items-center gap-2"
        onPointerDown={(event) => event.stopPropagation()}
      >
        <VoiceNotePlayPauseButton
          isPlaying={isPlaying}
          onClick={onTogglePlayback}
        />
        <VoiceNoteWaveform
          durationMs={durationMs}
          isPlaying={isPlaying}
          levels={waveformLevels}
          playbackMs={playbackMs}
        />
      </div>

      <div className=" flex items-center justify-between">
        <span className="text-[10px] tracking-tight text-black mono">
          {formatVoiceDuration(playbackMs)}
        </span>
        <span className="mono text-[10px] tracking-tight text-black mono">
          {formatVoiceDuration(durationMs)}
        </span>
      </div>

      <audio
        className="hidden"
        preload="metadata"
        src={audioDataUrl}
        ref={handleAudioRef}
        onEnded={onAudioEnded}
        onPause={onAudioPaused}
        onPlay={onAudioPlaying}
        onTimeUpdate={(event) => {
          onAudioTimeUpdate(Math.round(event.currentTarget.currentTime * 1000));
        }}
      />
    </div>
  );
}
