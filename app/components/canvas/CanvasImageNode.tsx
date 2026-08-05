"use client";

import type { PointerEvent as ReactPointerEvent } from "react";
import {
  IMAGE_RESIZE_CORNERS,
  NodeResizeHandles,
  type ResizeCorner,
} from "./NodeResizeHandles";
import { FlipHorizontal2, FlipVertical2, RotateCw, RotateCwSquare, SquareCenterlineDashedHorizontal, SquareCenterlineDashedVertical } from "lucide-react";

type CanvasImageNodeData = {
  id: string;
  fileName: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  transform?: {
    flipH?: boolean;
    flipV?: boolean;
    rotation?: number;
  };
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
  onTransform?: (transform: {
    flipH?: boolean;
    flipV?: boolean;
    rotation?: number;
  }) => void;
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
  onTransform,
}: CanvasImageNodeProps) {
  const flipH = node.transform?.flipH ?? false;
  const flipV = node.transform?.flipV ?? false;
  const rotation = node.transform?.rotation ?? 0;
  const imageTransform = [
    flipH ? "scaleX(-1)" : "",
    flipV ? "scaleY(-1)" : "",
    rotation ? `rotate(${rotation}deg)` : "",
  ]
    .filter(Boolean)
    .join(" ");

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
            style={{ transform: imageTransform }}
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
            <span className="text-[10px] mono uppercase tracking-tight text-white/80">
              Processing...
            </span>
          </div>
        </div>
      )}
      {error && (
        <div
          className="absolute inset-0 z-10 flex cursor-pointer items-center justify-center bg-black/60"
          onPointerDown={(event) => {
            event.stopPropagation();
            event.preventDefault();
          }}
          onPointerUp={(event) => {
            event.stopPropagation();
          }}
          onClick={(event) => {
            event.stopPropagation();
            event.preventDefault();
            onDismissError?.();
          }}
        >
          <div className="flex max-w-[90%] flex-col items-center gap-2 px-3 text-center">
            <span className="text-[10px] mono uppercase tracking-tight text-red-400">
              Upscale Failed
            </span>
            <span className="text-[10px] mono uppercase tracking-tight text-white/80 leading-snug">
              {error}
            </span>
            <span className="text-[9px] mono uppercase tracking-tight text-white/50">
              Click to dismiss
            </span>
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
      {isSelected && onTransform ? (
        <div
          className="absolute  -bottom-11 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-lg border border-white/10 bg-[#212126] px-1 py-1 shadow-xl backdrop-blur"
          onPointerDown={(event) => {
            event.stopPropagation();
            event.preventDefault();
          }}
          onPointerUp={(event) => {
            event.stopPropagation();
          }}
        >
          <button
            aria-label="Flip horizontal"
            aria-pressed={flipH}
            className={[
              "flex h-7 w-7 items-center justify-center rounded transition",
              flipH
                ? "bg-[#f8ff9a] text-black"
                : "text-white hover:bg-white/10 hover:text-white",
            ].join(" ")}
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              event.preventDefault();
              onTransform({ flipH: !flipH });
            }}
          >
            <SquareCenterlineDashedHorizontal className="h-3.5 w-3.5" />
          </button>
          <button
            aria-label="Flip vertical"
            aria-pressed={flipV}
            className={[
              "flex h-7 w-7 items-center justify-center rounded transition",
              flipV
                ? "bg-[#f8ff9a] text-black"
                : "text-white hover:bg-white/10 hover:text-white",
            ].join(" ")}
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              event.preventDefault();
              onTransform({ flipV: !flipV });
            }}
          >
            <SquareCenterlineDashedVertical className="h-3.5 w-3.5" />
          </button>
          <button
            aria-label="Rotate 90°"
            className="flex h-7 w-7 items-center justify-center rounded text-white transition hover:bg-white/10 hover:text-white"
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              event.preventDefault();
              onTransform({ rotation: (rotation + 90) % 360 });
            }}
          >
            <RotateCwSquare className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
