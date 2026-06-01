"use client";

import { formatVoiceDuration } from "@/lib/canvas/voiceNoteUtils";
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
  return (
    <div className="relative h-full w-full rounded-xl border border-white/20 bg-white/10 p-3 shadow-[0_10px_24px_rgba(0,0,0,0.35)] backdrop-blur">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="pixel truncate text-xs tracking-tight text-white">
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
          playbackMs={playbackMs}
        />
      </div>

      <div className="mt-1 flex items-center justify-between">
        <span className="pixel text-[10px] tracking-tight text-white/70">
          {formatVoiceDuration(playbackMs)}
        </span>
        <span className="pixel text-[10px] tracking-tight text-white/70">
          {formatVoiceDuration(durationMs)}
        </span>
      </div>

      <audio
        className="hidden"
        preload="metadata"
        src={audioDataUrl}
        ref={onAudioRef}
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
