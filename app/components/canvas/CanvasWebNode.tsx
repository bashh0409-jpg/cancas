"use client";

import type { PointerEvent as ReactPointerEvent } from "react";
import { WebsitePreviewCard } from "@/app/components/website-preview/WebsitePreviewCard";
import {
  NodeResizeHandles,
  WEB_RESIZE_CORNERS,
  type ResizeCorner,
} from "./NodeResizeHandles";

type CanvasWebNodeData = {
  id: string;
  url: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
};

type CanvasWebNodeProps = {
  node: CanvasWebNodeData;
  isDragging: boolean;
  isResizing: boolean;
  onPointerCancel: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerUp: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onResizePointerCancel: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  onResizePointerDown: (
    corner: ResizeCorner,
    event: ReactPointerEvent<HTMLButtonElement>,
  ) => void;
  onResizePointerMove: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  onResizePointerUp: (event: ReactPointerEvent<HTMLButtonElement>) => void;
};

export function CanvasWebNode({
  node,
  isDragging,
  isResizing,
  onPointerCancel,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onResizePointerCancel,
  onResizePointerDown,
  onResizePointerMove,
  onResizePointerUp,
}: CanvasWebNodeProps) {
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
      <WebsitePreviewCard url={node.url} />
      <div
        className={[
          "pointer-events-none absolute -inset-px rounded-lg border border-[#2244ec] transition",
          isResizing ? "opacity-100" : "opacity-0 group-hover:opacity-100",
        ].join(" ")}
      />
      <NodeResizeHandles
        corners={WEB_RESIZE_CORNERS}
        labelPrefix="link preview"
        visible={isResizing}
        onPointerCancel={onResizePointerCancel}
        onPointerDown={onResizePointerDown}
        onPointerMove={onResizePointerMove}
        onPointerUp={onResizePointerUp}
      />
    </div>
  );
}
