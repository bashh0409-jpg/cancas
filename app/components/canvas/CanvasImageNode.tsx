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
  processing?: boolean;
  error?: string | null;
  onPointerCancel: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerUp: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onImageSettled: () => void;
  onDismissError?: () => void;
  onContextMenu?: (event: React.MouseEvent<HTMLDivElement>) => void;
  onResizePointerCancel: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  onResizePointerDown: (
    corner: ResizeCorner,
    event: ReactPointerEvent<HTMLButtonElement>,
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
  processing = false,
  error = null,
  onPointerCancel,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onImageSettled,
  onDismissError,
  onContextMenu,
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
      onContextMenu={onContextMenu}
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
      {processing && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
            <span className="text-[10px] mono uppercase tracking-tight text-white/80">Processing...</span>
          </div>
        </div>
      )}
      {error && (
        <div
          className="absolute inset-0 z-10 flex cursor-pointer items-center justify-center bg-black/60"
          onClick={(event) => {
            event.stopPropagation();
            event.preventDefault();
            onDismissError?.();
          }}
        >
          <div className="flex max-w-[90%] flex-col items-center gap-2 px-3 text-center">
            <span className="text-[10px] mono uppercase tracking-tight text-red-400">Upscale Failed</span>
            <span className="text-[10px] mono uppercase tracking-tight text-white/80 leading-snug">{error}</span>
            <span className="text-[9px] mono uppercase tracking-tight text-white/50">Click to dismiss</span>
          </div>
        </div>
      )}
      <div
        className={[
          "pointer-events-none absolute -inset-px border transition",
          isSelected
            ? "border-[#2244ec] opacity-100"
            : "border-[#2244ec] opacity-0 group-hover:opacity-100",
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