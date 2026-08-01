"use client";

import type { PointerEvent as ReactPointerEvent } from "react";

export type CanvasTranscriptionNodeData = {
  id: string;
  sourceNodeId?: string;
  text: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  visible?: boolean;
  locked?: boolean;
  style: {
    backgroundColor: string;
    color: string;
    fontFamily: string;
    fontSize: number;
  };
};

type CanvasTranscriptionNodeProps = {
  node: CanvasTranscriptionNodeData;
  isDragging: boolean;
  isSelected: boolean;
  hasInput: boolean;
  onContextMenu: (event: React.MouseEvent<HTMLDivElement>) => void;
  onDisconnectInput: () => void;
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerUp: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerCancel: (event: ReactPointerEvent<HTMLDivElement>) => void;
};

export function CanvasTranscriptionNode({
  node,
  isDragging,
  isSelected,
  hasInput,
  onContextMenu,
  onDisconnectInput,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
}: CanvasTranscriptionNodeProps) {
  return (
    <div
      className={[
        "absolute flex flex-col overflow-visible rounded px-3.5 py-3 shadow-lg select-none",
        isDragging ? "cursor-grabbing" : "cursor-grab",
        isSelected,
      ].join(" ")}
      style={{
        left: node.position.x,
        top: node.position.y,
        width: node.size.width,
        height: node.size.height,
        zIndex: node.zIndex,
        backgroundColor: node.style.backgroundColor,
        color: node.style.color,
        fontFamily: node.style.fontFamily,
        fontSize: node.style.fontSize,
      }}
      onContextMenu={onContextMenu}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      {hasInput && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onDisconnectInput();
          }}
          className="absolute left-[-8px] top-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full border border-white/30 bg-white/10 transition hover:bg-white/30"
          aria-label="Disconnect transcription input"
        />
      )}
      <div className="mb-1.5 text-xs mono uppercase tracking-tight font-medium  opacity-40">
        Transcription
      </div>
      <div className="flex-1 overflow-y-auto whitespace-pre-wrap break-words">
        {node.text}
      </div>
    </div>
  );
}
