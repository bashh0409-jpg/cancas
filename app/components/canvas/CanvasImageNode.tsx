"use client";

import type { PointerEvent as ReactPointerEvent } from "react";
import {
  IMAGE_RESIZE_CORNERS,
  NodeResizeHandles,
  type ResizeCorner,
} from "./NodeResizeHandles";

type CanvasImageNodeData = {
  id: string;
  fileName: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
};

type CanvasImageNodeProps = {
  node: CanvasImageNodeData;
  imageSrc: string | null;
  isSelected: boolean;
  showResizeHandles: boolean;
  isDragging: boolean;
  isResizing: boolean;
  onPointerCancel: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerUp: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onImageSettled: () => void;
  onResizePointerCancel: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  onResizePointerDown: (
    corner: ResizeCorner,
    event: ReactPointerEvent<HTMLButtonElement>
  ) => void;
  onResizePointerMove: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  onResizePointerUp: (event: ReactPointerEvent<HTMLButtonElement>) => void;
};

export function CanvasImageNode({
  node,
  imageSrc,
  isSelected,
  showResizeHandles,
  isDragging,
  isResizing,
  onPointerCancel,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onImageSettled,
  onResizePointerCancel,
  onResizePointerDown,
  onResizePointerMove,
  onResizePointerUp,
}: CanvasImageNodeProps) {
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
      {imageSrc ? (
        <>
          {/* Object URLs from local drops are not compatible with next/image optimization. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt={node.fileName}
            className="block h-full w-full select-none object-contain"
            draggable={false}
            src={imageSrc}
            onError={onImageSettled}
            onLoad={onImageSettled}
          />
        </>
      ) : (
        <div
          aria-hidden
          className="flex h-full w-full items-center justify-center bg-white/5"
        >
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white/70" />
        </div>
      )}
      <div
        className={[
          "pointer-events-none absolute -inset-px border transition",
          isSelected
            ? "border-[#0d99ff] opacity-100"
            : "border-[#0d99ff] opacity-0 group-hover:opacity-100",
          isResizing ? "opacity-100" : "",
        ].join(" ")}
      />
      {showResizeHandles ? (
        <NodeResizeHandles
          corners={IMAGE_RESIZE_CORNERS}
          labelPrefix="image"
          visible={isResizing || isSelected}
          onPointerCancel={onResizePointerCancel}
          onPointerDown={onResizePointerDown}
          onPointerMove={onResizePointerMove}
          onPointerUp={onResizePointerUp}
        />
      ) : null}
    </div>
  );
}
