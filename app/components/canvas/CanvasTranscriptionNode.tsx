"use client";

import type { PointerEvent as ReactPointerEvent } from "react";

export type CanvasTranscriptionNodeData = {
  id: string;
  sourceNodeId: string;
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
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerUp: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerCancel: (event: ReactPointerEvent<HTMLDivElement>) => void;
};

export function CanvasTranscriptionNode({
  node,
  isDragging,
  isSelected,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
}: CanvasTranscriptionNodeProps) {
  return (
    <div
      className={[
        "absolute flex flex-col overflow-hidden rounded px-3.5 py-3 shadow-lg select-none",
        isDragging ? "cursor-grabbing" : "cursor-grab",
        isSelected 
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
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      <div className="mb-1.5 text-xs mono tracking-tight opacity-50">
        Transcription
      </div>
      <div className="flex-1 overflow-y-auto whitespace-pre-wrap break-words">
        {node.text}
      </div>
    </div>
  );
}