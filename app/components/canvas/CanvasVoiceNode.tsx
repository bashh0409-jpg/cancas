"use client";

import type { PointerEvent as ReactPointerEvent } from "react";
import { VoiceNoteCard } from "./VoiceNoteCard";
import type { VoiceNoteMenuAction } from "./VoiceNoteOptionsMenu";

type CanvasVoiceNodeData = {
  id: string;
  title: string;
  audioDataUrl?: string;
  durationMs: number;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
};

type CanvasVoiceNodeProps = {
  node: CanvasVoiceNodeData;
  isDragging: boolean;
  isPlaying: boolean;
  isMenuOpen: boolean;
  hasOutput: boolean;
  onDisconnectOutputs: () => void;
  playbackMs: number;
  onPointerCancel: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerUp: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onToggleMenu: () => void;
  onMenuAction: (action: VoiceNoteMenuAction) => void;
  onTogglePlayback: () => void;
  onAudioRef: (element: HTMLAudioElement | null) => void;
  onAudioEnded: () => void;
  onAudioPaused: () => void;
  onAudioPlaying: () => void;
  onAudioTimeUpdate: (playbackMs: number) => void;
};

export function CanvasVoiceNode({
  node,
  isDragging,
  isPlaying,
  isMenuOpen,
  hasOutput,
  onDisconnectOutputs,
  playbackMs,
  onPointerCancel,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onToggleMenu,
  onMenuAction,
  onTogglePlayback,
  onAudioRef,
  onAudioEnded,
  onAudioPaused,
  onAudioPlaying,
  onAudioTimeUpdate,
}: CanvasVoiceNodeProps) {
  return (
    <div
      className="group absolute"
      onPointerCancel={onPointerCancel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{
        cursor: isDragging ? "grabbing" : "grab",
        height: node.size.height,
        left: node.position.x,
        top: node.position.y,
        width: node.size.width,
        zIndex: node.zIndex,
      }}
    >
      {hasOutput && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onDisconnectOutputs();
          }}
          className="absolute right-[-8px] z-10 top-1/7 -translate-y-1 h-3.5 w-3.5 rounded-full border border-[#6EDDB3] bg-[#6EDDB3] transition hover:bg-[#6EDDB3]/40"
          aria-label="Disconnect voice outputs"
        >
          <span className="absolute left-1/2 top-1/2 h-2 rounded-full border-2 border-[#212126] w-2 -translate-x-1/2 -translate-y-1/2 bg-[#6EDDB3]" />
        </button>
      )}
      <VoiceNoteCard
        audioDataUrl={node.audioDataUrl}
        durationMs={node.durationMs}
        isMenuOpen={isMenuOpen}
        isPlaying={isPlaying}
        playbackMs={playbackMs}
        title={node.title}
        onAudioEnded={onAudioEnded}
        onAudioPaused={onAudioPaused}
        onAudioPlaying={onAudioPlaying}
        onAudioRef={onAudioRef}
        onAudioTimeUpdate={onAudioTimeUpdate}
        onMenuAction={onMenuAction}
        onToggleMenu={onToggleMenu}
        onTogglePlayback={onTogglePlayback}
      />
    </div>
  );
}
