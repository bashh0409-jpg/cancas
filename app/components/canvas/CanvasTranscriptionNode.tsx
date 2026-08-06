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
  label?: string;
  isDragging: boolean;
  isSelected: boolean;
  hasInput: boolean;
  onContextMenu: (event: React.MouseEvent<HTMLDivElement>) => void;
  onDisconnectInput: () => void;
  onPointerEnter: () => void;
  onPointerLeave: () => void;
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerUp: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerCancel: (event: ReactPointerEvent<HTMLDivElement>) => void;
};

export function CanvasTranscriptionNode({
  node,
  label,
  isDragging,
  isSelected,
  hasInput,
  onContextMenu,
  onDisconnectInput,
  onPointerEnter,
  onPointerLeave,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
}: CanvasTranscriptionNodeProps) {
  return (
    <div
      className={[
        "absolute flex flex-col overflow-visible rounded p-2 shadow-lg select-none",
        isDragging ? "cursor-grabbing" : "cursor-grab",
        isSelected,
      ].join(" ")}
      style={{
        left: node.position.x,
        top: node.position.y,
        width: node.size.width,
        minHeight: node.size.height,
        maxHeight: 500,
        zIndex: node.zIndex,
        backgroundColor: node.style.backgroundColor,
        color: node.style.color,
        fontFamily: node.style.fontFamily,
        fontSize: node.style.fontSize,
      }}
      onContextMenu={onContextMenu}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
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
          className="absolute left-[-8px] top-13 h-3.5 w-3.5 rounded-full border border-[#6EDDB3] bg-[#6EDDB3] transition hover:bg-[#6EDDB3]/40"
          aria-label="Disconnect transcription input"
        >
          <span className="absolute left-1/2 top-1/2 h-2 rounded-full border-2 border-[#212126] w-2 -translate-x-1/2 -translate-y-1/2 bg-[#6EDDB3]" />
        </button>
      )}
      <div className="mb-1.5 hidden text-xs mono uppercase tracking-tight font-medium  opacity-40">
        {label ?? "Transcription"}
      </div>
      <div className="overflow-y-auto whitespace-pre-wrap tracking-tight leading-4 break-words max-h-full">
        {node.text}
      </div>
    </div>
  );
}
