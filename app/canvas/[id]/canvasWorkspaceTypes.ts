import type { ResizeCorner } from "@/app/components/canvas/NodeResizeHandles";
import type { CanvasTextNodeData } from "@/app/components/canvas/CanvasTextNode";
import type { CanvasContent } from "@/types/canvas";

export type Viewport = {
  x: number;
  y: number;
  zoom: number;
};

export type Point = {
  x: number;
  y: number;
};

export type ImageCanvasNode = {
  id: string;
  fileName: string;
  url: string;
  storagePath?: string;
  fileSizeBytes?: number;
  position: Point;
  size: {
    width: number;
    height: number;
  };
  zIndex: number;
  visible?: boolean;
  locked?: boolean;
  transform?: {
    flipH?: boolean;
    flipV?: boolean;
    rotation?: number;
  };
};

export type ImageSyncStats = {
  synced: number;
  total: number;
  failed: number;
};

export type CanvasWorkspaceProps = {
  canvasId: string;
  userId: string;
  canvasName: string;
  canvases: { id: string; name: string; slug: string; size_bytes: number }[];
  initialContent: CanvasContent;
  serverUpdatedAt: string;
  onImageSyncStatsChange?: (stats: ImageSyncStats) => void;
  onUploadDebugEntry?: (entry: import("@/lib/canvas/uploadDebug").UploadDebugEntry) => void;
  onRemoteNameChange?: (name: string) => void;
  onStorageSizeChange?: (sizeBytes: number) => void;
};

export type LocalCanvasDraft = {
  content: CanvasContent;
  savedAt: string;
  serverUpdatedAt: string;
  syncedAt?: string;
};

export type ImageDragState = {
  anchorId: string;
  offset: Point;
  nodeIds: string[];
  startPositions: Record<string, Point>;
};

export type MarqueeState = {
  start: Point;
  current: Point;
  additive: boolean;
};

export type WebCanvasNode = {
  id: string;
  url: string;
  title: string;
  position: Point;
  size: {
    width: number;
    height: number;
  };
  zIndex: number;
  visible?: boolean;
  locked?: boolean;
};

export type WebDragState = {
  nodeId: string;
  offset: Point;
  startPoint: Point;
  hasMoved: boolean;
};

export type VoiceCanvasNode = {
  id: string;
  title: string;
  audioDataUrl?: string;
  storagePath?: string;
  durationMs: number;
  position: Point;
  size: {
    width: number;
    height: number;
  };
  zIndex: number;
  visible?: boolean;
  locked?: boolean;
};

export type VoiceDragState = {
  nodeId: string;
  offset: Point;
};

export type TextDragState = {
  nodeId: string;
  offset: Point;
};

export type NodeResizeState = {
  nodeId: string;
  corner: ResizeCorner;
  startPoint: Point;
  startPosition: Point;
  startSize: {
    width: number;
    height: number;
  };
  lockAspectRatio: boolean;
};
