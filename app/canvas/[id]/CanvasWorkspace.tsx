"use client";

import type {
  CSSProperties,
  DragEvent as ReactDragEvent,
  PointerEvent as ReactPointerEvent,
  WheelEvent,
} from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CanvasContentsPanel,
  type CanvasContentsItem,
} from "@/app/components/canvas/CanvasContentsPanel";
import { CanvasDropOverlay } from "@/app/components/canvas/CanvasDropOverlay";
import { CanvasFitToViewButton } from "@/app/components/canvas/CanvasFitToViewButton";
import { CanvasGridControls } from "@/app/components/canvas/CanvasGridControls";
import { CanvasImageNode } from "@/app/components/canvas/CanvasImageNode";
import { CanvasLoadingOverlay } from "@/app/components/canvas/CanvasLoadingOverlay";
import { CanvasMarqueeSelection } from "@/app/components/canvas/CanvasMarqueeSelection";
import { CanvasVoiceNode } from "@/app/components/canvas/CanvasVoiceNode";
import { CanvasWebNode } from "@/app/components/canvas/CanvasWebNode";
import { CanvasZoomControls } from "@/app/components/canvas/CanvasZoomControls";
import { ImageSelectionArrangeBar } from "@/app/components/canvas/ImageSelectionArrangeBar";
import type { VoiceNoteMenuAction } from "@/app/components/canvas/VoiceNoteOptionsMenu";
import type { ResizeCorner } from "@/app/components/canvas/NodeResizeHandles";
import { WebsitePreviewModal } from "@/app/components/website-preview/WebsitePreviewModal";
import {
  arrangeImagesFromRequest,
  getSelectionOrigin,
  type LayoutArrangeRequest,
} from "@/lib/canvas/imageLayouts";
import {
  fetchRemoteCanvasUpdate,
  subscribeToCanvasUpdates,
} from "@/lib/canvas/canvasRemoteSync";
import {
  VOICE_NOTE_RECORDED_EVENT,
  type VoiceNoteRecordedDetail,
} from "@/lib/canvas/voiceNotes";
import { mergeRemoteImageNodes } from "@/lib/canvas/mergeRemoteCanvas";
import {
  IMAGE_DELETE_UNDO_LIMIT,
  type ImageDeleteUndoEntry,
} from "@/lib/canvas/imageDeleteUndo";
import {
  deletePendingUploadFile,
  getPendingUploadFile,
  savePendingUploadFile,
} from "@/lib/canvas/pendingUploads";
import { deleteCanvasImage, uploadCanvasImage } from "@/lib/canvas/storage";
import { canvasImageUploadPool } from "@/lib/canvas/uploadPool";
import {
  createUploadDebugEntry,
  logUploadDebug,
  type UploadDebugEntry,
} from "@/lib/canvas/uploadDebug";
import { sleep, withTimeout } from "@/lib/canvas/uploadUtils";
import { createClient } from "@/lib/supabase/client";
import { useVoiceNotePlayback } from "@/lib/canvas/useVoiceNotePlayback";
import {
  blobToDataUrl,
  formatVoiceNoteTitle,
} from "@/lib/canvas/voiceNoteUtils";
import { parseCanvasContent, type CanvasContent } from "@/types/canvas";

type Viewport = {
  x: number;
  y: number;
  zoom: number;
};

type Point = {
  x: number;
  y: number;
};

type ImageCanvasNode = {
  id: string;
  fileName: string;
  url: string;
  storagePath?: string;
  position: Point;
  size: {
    width: number;
    height: number;
  };
  zIndex: number;
};

type ImageSyncStats = {
  synced: number;
  total: number;
};

type CanvasWorkspaceProps = {
  canvasId: string;
  userId: string;
  canvasName: string;
  initialContent: CanvasContent;
  serverUpdatedAt: string;
  onImageSyncStatsChange?: (stats: ImageSyncStats) => void;
  onUploadDebugEntry?: (entry: UploadDebugEntry) => void;
  onRemoteNameChange?: (name: string) => void;
};

type LocalCanvasDraft = {
  content: CanvasContent;
  savedAt: string;
  serverUpdatedAt: string;
  syncedAt?: string;
};

type ImageDragState = {
  anchorId: string;
  offset: Point;
  nodeIds: string[];
  startPositions: Record<string, Point>;
};

type MarqueeState = {
  start: Point;
  current: Point;
  additive: boolean;
};

type WebCanvasNode = {
  id: string;
  url: string;
  title: string;
  position: Point;
  size: {
    width: number;
    height: number;
  };
  zIndex: number;
};

type WebDragState = {
  nodeId: string;
  offset: Point;
  startPoint: Point;
  hasMoved: boolean;
};

type VoiceCanvasNode = {
  id: string;
  title: string;
  audioDataUrl: string;
  durationMs: number;
  position: Point;
  size: {
    width: number;
    height: number;
  };
  zIndex: number;
};

type VoiceDragState = {
  nodeId: string;
  offset: Point;
};

type NodeResizeState = {
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

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function parseHexColor(value: string) {
  const match = value.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);

  if (!match) {
    return null;
  }

  const hex = match[1];

  if (hex.length === 3) {
    return {
      r: parseInt(hex[0] + hex[0], 16),
      g: parseInt(hex[1] + hex[1], 16),
      b: parseInt(hex[2] + hex[2], 16),
    };
  }

  return {
    r: parseInt(hex.slice(0, 2), 16),
    g: parseInt(hex.slice(2, 4), 16),
    b: parseInt(hex.slice(4, 6), 16),
  };
}

function parseRgbColor(value: string) {
  // matches rgb(r,g,b) and rgba(r,g,b,a)
  const match = value.match(
    /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9.]+))?\)/i,
  );

  if (!match) return null;

  return {
    r: Number(match[1]),
    g: Number(match[2]),
    b: Number(match[3]),
  };
}

function parseColor(value: string) {
  if (!value) return null;
  const hex = parseHexColor(value);
  if (hex) return hex;
  const rgb = parseRgbColor(value);
  if (rgb) return rgb;
  return null;
}

function isLightColor(value: string) {
  const rgb = parseColor(value);

  if (!rgb) {
    return false;
  }

  const luminance = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;

  return luminance > 180;
}

const MIN_ZOOM = 0.001;
const MAX_ZOOM = 100;
const ZOOM_SCALE_FACTOR = 1.2;

const DEFAULT_BACKGROUND = "#111111";
const DEFAULT_GRID_COLOR = "#343434";
const DEFAULT_GRID_SIZE = 32;
const DEFAULT_SHOW_GRID = true;

function getNaturalImageSize(url: string) {
  return new Promise<{ width: number; height: number }>((resolve) => {
    const image = new Image();

    image.onload = () => {
      resolve({
        width: image.naturalWidth,
        height: image.naturalHeight,
      });
    };

    image.onerror = () => {
      resolve({ width: 260, height: 180 });
    };

    image.src = url;
  });
}

function fitImageSize(width: number, height: number) {
  const maxWidth = 520;
  const maxHeight = 380;
  const scale = Math.min(1, maxWidth / width, maxHeight / height);

  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function getUrlFromText(text: string) {
  const match = text.match(/https?:\/\/[^\s"'<>]+/i);

  if (!match) {
    return null;
  }

  try {
    return new URL(match[0]).toString();
  } catch {
    return null;
  }
}

function getWebsiteTitle(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "Website";
  }
}

function normalizeRect(start: Point, end: Point) {
  return {
    x: Math.min(start.x, end.x),
    y: Math.min(start.y, end.y),
    width: Math.abs(end.x - start.x),
    height: Math.abs(end.y - start.y),
  };
}

function isPendingCloudSync(node: ImageCanvasNode) {
  return !node.storagePath;
}

function getImageNodeSrc(node: ImageCanvasNode) {
  const url = node.url.trim();

  return url.length > 0 ? url : null;
}

function serializeImageNodeForSave(node: ImageCanvasNode) {
  const pending = isPendingCloudSync(node);

  return {
    id: node.id,
    fileName: node.fileName,
    url: pending && node.url.startsWith("blob:") ? "" : node.url,
    storagePath: node.storagePath,
    position: node.position,
    size: node.size,
    zIndex: node.zIndex,
  };
}

function imageIntersectsRect(
  node: ImageCanvasNode,
  rect: ReturnType<typeof normalizeRect>,
) {
  return (
    node.position.x < rect.x + rect.width &&
    node.position.x + node.size.width > rect.x &&
    node.position.y < rect.y + rect.height &&
    node.position.y + node.size.height > rect.y
  );
}

function getLocalDraftKey(canvasId: string) {
  return `canvasai:canvas:${canvasId}:draft`;
}

function readLocalCanvasDraft(
  canvasId: string,
  serverUpdatedAt: string,
): LocalCanvasDraft | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawDraft = window.localStorage.getItem(getLocalDraftKey(canvasId));

    if (!rawDraft) {
      return null;
    }

    const parsedDraft = JSON.parse(rawDraft) as Record<string, unknown>;
    const content = parseCanvasContent(parsedDraft.content);
    const savedAt =
      typeof parsedDraft.savedAt === "string" ? parsedDraft.savedAt : null;
    const draftServerUpdatedAt =
      typeof parsedDraft.serverUpdatedAt === "string"
        ? parsedDraft.serverUpdatedAt
        : "";
    const syncedAt =
      typeof parsedDraft.syncedAt === "string"
        ? parsedDraft.syncedAt
        : undefined;

    if (!content || !savedAt) {
      return null;
    }

    const savedTime = Date.parse(savedAt);
    const syncedTime = syncedAt ? Date.parse(syncedAt) : 0;
    const serverTime = Date.parse(serverUpdatedAt);

    if (Number.isNaN(savedTime)) {
      return null;
    }

    const hasUnsyncedChanges = !syncedAt || savedTime > syncedTime;
    const isNewerThanServer =
      Number.isNaN(serverTime) || savedTime > serverTime;

    if (!hasUnsyncedChanges && !isNewerThanServer) {
      return null;
    }

    return {
      content,
      savedAt,
      serverUpdatedAt: draftServerUpdatedAt,
      syncedAt,
    };
  } catch {
    return null;
  }
}

function writeLocalCanvasDraft(
  canvasId: string,
  content: CanvasContent,
  serverUpdatedAt: string,
  syncedAt?: string,
) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const savedAt = new Date().toISOString();
    const draft: LocalCanvasDraft = {
      content,
      savedAt,
      serverUpdatedAt,
      syncedAt,
    };

    window.localStorage.setItem(
      getLocalDraftKey(canvasId),
      JSON.stringify(draft),
    );
  } catch {
    // localStorage can be full or unavailable; Supabase autosave still runs.
  }
}

function markLocalCanvasDraftSynced(
  canvasId: string,
  content: CanvasContent,
  serverUpdatedAt: string,
) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const syncedAt = new Date().toISOString();
    const draft: LocalCanvasDraft = {
      content,
      savedAt: syncedAt,
      serverUpdatedAt,
      syncedAt,
    };

    window.localStorage.setItem(
      getLocalDraftKey(canvasId),
      JSON.stringify(draft),
    );
  } catch {
    // Best-effort backup only.
  }
}

export default function CanvasWorkspace({
  canvasId,
  userId,
  canvasName,
  initialContent,
  serverUpdatedAt,
  onImageSyncStatsChange,
  onUploadDebugEntry,
  onRemoteNameChange,
}: CanvasWorkspaceProps) {
  const initialImageIdsRef = useRef(
    new Set(initialContent.imageNodes.map((node) => node.id)),
  );
  const canvasRef = useRef<HTMLDivElement>(null);
  const imageNodesRef = useRef<ImageCanvasNode[]>(initialContent.imageNodes);
  const webNodesRef = useRef<WebCanvasNode[]>([]);
  const voiceNodesRef = useRef<VoiceCanvasNode[]>(initialContent.voiceNodes);
  const imageDragRef = useRef<ImageDragState | null>(null);
  const imageResizeRef = useRef<NodeResizeState | null>(null);
  const webDragRef = useRef<WebDragState | null>(null);
  const voiceDragRef = useRef<VoiceDragState | null>(null);
  const webResizeRef = useRef<NodeResizeState | null>(null);
  const skipSaveRef = useRef(true);
  const [isClientReady, setIsClientReady] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveDelayMsRef = useRef(1200);
  const lastServerUpdatedAtRef = useRef(serverUpdatedAt);
  const isApplyingRemoteUpdateRef = useRef(false);
  const pendingUploadFilesRef = useRef<
    Map<string, { file: File; blobUrl: string }>
  >(new Map());
  const pendingUploadIdsRef = useRef<Set<string>>(new Set());
  const imageDeleteUndoStackRef = useRef<ImageDeleteUndoEntry[]>([]);
  const imageDeleteRedoStackRef = useRef<ImageDeleteUndoEntry[]>([]);
  const selectedImageIdsRef = useRef<string[]>([]);
  const supabaseClientRef = useRef(createClient());
  const [viewport, setViewport] = useState<Viewport>(initialContent.viewport);
  const [showGridControls, setShowGridControls] = useState(false);
  const [showContentsPanel, setShowContentsPanel] = useState(false);
  const [showGrid, setShowGrid] = useState(initialContent.showGrid);
  const [backgroundColor, setBackgroundColor] = useState(
    initialContent.backgroundColor,
  );
  const [gridColor, setGridColor] = useState(initialContent.gridColor);
  const [gridSize, setGridSize] = useState(initialContent.gridSize);
  const handleResetGrid = () => {
    setBackgroundColor(DEFAULT_BACKGROUND);
    setGridColor(DEFAULT_GRID_COLOR);
    setGridSize(DEFAULT_GRID_SIZE);
    setShowGrid(DEFAULT_SHOW_GRID);
    setShowGridControls(false); // optional UX: close panel after reset
  };
  const [isFileDragging, setIsFileDragging] = useState(false);
  const [draggingImageNodeId, setDraggingImageNodeId] = useState<string | null>(
    null,
  );
  const [resizingImageNodeId, setResizingImageNodeId] = useState<string | null>(
    null,
  );
  const [resizingWebNodeId, setResizingWebNodeId] = useState<string | null>(
    null,
  );
  const [draggingWebNodeId, setDraggingWebNodeId] = useState<string | null>(
    null,
  );
  const [draggingVoiceNodeId, setDraggingVoiceNodeId] = useState<string | null>(
    null,
  );
  const [imageNodes, setImageNodes] = useState<ImageCanvasNode[]>(
    initialContent.imageNodes,
  );
  const [webNodes, setWebNodes] = useState<WebCanvasNode[]>(
    initialContent.webNodes,
  );
  const [voiceNodes, setVoiceNodes] = useState<VoiceCanvasNode[]>(
    initialContent.voiceNodes,
  );
  const [pendingVoiceRecording, setPendingVoiceRecording] =
    useState<VoiceNoteRecordedDetail | null>(null);
  const [openVoiceMenuNodeId, setOpenVoiceMenuNodeId] = useState<string | null>(
    null,
  );
  const {
    playingNodeId: playingVoiceNodeId,
    playbackMsByNodeId: voicePlaybackMsByNodeId,
    registerAudioElement,
    togglePlayback: toggleVoicePlayback,
    removeNodePlayback,
    handleAudioEnded,
    handleAudioPaused,
    handleAudioPlaying,
    handleAudioTimeUpdate,
    cleanupAllAudio,
  } = useVoiceNotePlayback();
  const [activeWebNodeId, setActiveWebNodeId] = useState<string | null>(null);
  const [selectedImageIds, setSelectedImageIds] = useState<string[]>([]);
  const [marquee, setMarquee] = useState<MarqueeState | null>(null);
  const [isCanvasLoading, setIsCanvasLoading] = useState(true);
  const [settledInitialImageIds, setSettledInitialImageIds] = useState<
    Set<string>
  >(() => new Set());
  const gridSizePercent = ((gridSize - 12) / (80 - 12)) * 100;
  const initialImageCount = initialImageIdsRef.current.size;
  const activeWebNode =
    webNodes.find((node) => node.id === activeWebNodeId) ?? null;
  const selectedImageIdSet = useMemo(
    () => new Set(selectedImageIds),
    [selectedImageIds],
  );

  const cloudSyncedCount = useMemo(
    () => imageNodes.filter((node) => Boolean(node.storagePath)).length,
    [imageNodes],
  );
  const totalImageCount = imageNodes.length;
  const marqueeRect = marquee
    ? normalizeRect(marquee.start, marquee.current)
    : null;
  const zoomPercent =
    viewport.zoom >= 0.01
      ? `${Math.round(viewport.zoom * 100)}%`
      : `${(viewport.zoom * 100).toFixed(1)}%`;
  const canvasContentsItems = useMemo<CanvasContentsItem[]>(
    () =>
      [
        ...imageNodes.map((node) => ({
          id: node.id,
          kind: "image" as const,
          label: node.fileName,
        })),
        ...webNodes.map((node) => ({
          id: node.id,
          kind: "website" as const,
          label: node.title,
        })),
        ...voiceNodes.map((node) => ({
          id: node.id,
          kind: "voice" as const,
          label: node.title,
        })),
      ].sort((a, b) => {
        const getZIndex = (item: CanvasContentsItem) => {
          if (item.kind === "image") {
            return imageNodes.find((node) => node.id === item.id)?.zIndex ?? 0;
          }

          if (item.kind === "website") {
            return webNodes.find((node) => node.id === item.id)?.zIndex ?? 0;
          }

          return voiceNodes.find((node) => node.id === item.id)?.zIndex ?? 0;
        };

        return getZIndex(b) - getZIndex(a);
      }),
    [imageNodes, voiceNodes, webNodes],
  );

  useEffect(() => {
    onImageSyncStatsChange?.({
      synced: cloudSyncedCount,
      total: totalImageCount,
    });
  }, [cloudSyncedCount, totalImageCount, onImageSyncStatsChange]);

  useEffect(() => {
    const localDraft = readLocalCanvasDraft(canvasId, serverUpdatedAt);

    if (localDraft?.content) {
      const content = localDraft.content;

      setViewport(content.viewport);
      setShowGrid(content.showGrid);
      setBackgroundColor(content.backgroundColor);
      setGridColor(content.gridColor);
      setGridSize(content.gridSize);
      setImageNodes(content.imageNodes);
      setWebNodes(content.webNodes);
      setVoiceNodes(content.voiceNodes);
      imageNodesRef.current = content.imageNodes;
      webNodesRef.current = content.webNodes;
      voiceNodesRef.current = content.voiceNodes;
      initialImageIdsRef.current = new Set(
        content.imageNodes.map((node) => node.id),
      );
      setSettledInitialImageIds(new Set());
      skipSaveRef.current = true;
    } else {
      skipSaveRef.current = false;
    }

    setIsClientReady(true);
  }, [canvasId, serverUpdatedAt]);

  // Normalize existing text node colors on first client ready pass. If saved
  // text nodes used the default white color but the canvas background is
  // light, switch them to black for readability.

  useEffect(() => {
    if (!isClientReady) {
      return;
    }

    let cancelled = false;

    async function resumePendingUploads() {
      const nodesNeedingSync = imageNodesRef.current.filter((node) =>
        isPendingCloudSync(node),
      );

      const nodesToResume = [];
      const orphans: string[] = [];

      for (const node of nodesNeedingSync) {
        if (cancelled || pendingUploadFilesRef.current.has(node.id)) {
          continue;
        }

        const file = await getPendingUploadFile(canvasId, node.id);

        if (!file) {
          if (!getImageNodeSrc(node)) {
            orphans.push(node.id);
          }

          continue;
        }

        const blobUrl = URL.createObjectURL(file);

        pendingUploadFilesRef.current.set(node.id, { file, blobUrl });
        pendingUploadIdsRef.current.add(node.id);

        setImageNodes((current) =>
          current.map((entry) =>
            entry.id === node.id ? { ...entry, url: blobUrl } : entry,
          ),
        );

        nodesToResume.push({ nodeId: node.id, file, blobUrl });
      }

      if (orphans.length > 0) {
        setImageNodes((current) =>
          current.filter((node) => !orphans.includes(node.id)),
        );
      }

      for (const entry of nodesToResume) {
        if (cancelled) {
          return;
        }

        canvasImageUploadPool.enqueue(() =>
          syncImageToStorage(entry.nodeId, entry.file, entry.blobUrl),
        );
      }
    }

    void resumePendingUploads();

    return () => {
      cancelled = true;
    };
  }, [canvasId, userId, isClientReady]);

  const commitImageDeleteEntry = useCallback(
    (entry: ImageDeleteUndoEntry) => {
      const supabase = supabaseClientRef.current;

      for (const node of entry.nodes) {
        const pending = entry.pendingByNodeId[node.id];

        if (pending) {
          URL.revokeObjectURL(pending.blobUrl);
          void deletePendingUploadFile(canvasId, node.id);
        } else if (node.url.startsWith("blob:")) {
          URL.revokeObjectURL(node.url);
        }

        pendingUploadFilesRef.current.delete(node.id);
        pendingUploadIdsRef.current.delete(node.id);

        if (node.storagePath) {
          void deleteCanvasImage(supabase, node.storagePath).catch(() => {
            // Best-effort storage cleanup.
          });
        }
      }
    },
    [canvasId],
  );

  const flushImageDeleteRedoStack = useCallback(() => {
    for (const entry of imageDeleteRedoStackRef.current) {
      commitImageDeleteEntry(entry);
    }

    imageDeleteRedoStackRef.current = [];
  }, [commitImageDeleteEntry]);

  const applyImageDeleteEntryToCanvas = useCallback(
    (entry: ImageDeleteUndoEntry) => {
      const removedIds = new Set(entry.nodes.map((node) => node.id));

      for (const node of entry.nodes) {
        pendingUploadFilesRef.current.delete(node.id);
        pendingUploadIdsRef.current.delete(node.id);
      }

      setImageNodes((current) =>
        current.filter((node) => !removedIds.has(node.id)),
      );
      setSelectedImageIds((current) =>
        current.filter((id) => !removedIds.has(id)),
      );
    },
    [],
  );

  const removeImageNodes = useCallback(
    (ids: string[]) => {
      if (ids.length === 0) {
        return;
      }

      const removedIds = new Set(ids);
      const nodesToRemove = imageNodesRef.current.filter((node) =>
        removedIds.has(node.id),
      );

      if (nodesToRemove.length === 0) {
        return;
      }

      flushImageDeleteRedoStack();

      const pendingByNodeId: ImageDeleteUndoEntry["pendingByNodeId"] = {};

      for (const node of nodesToRemove) {
        const pending = pendingUploadFilesRef.current.get(node.id);

        if (pending) {
          pendingByNodeId[node.id] = pending;
        }

        pendingUploadFilesRef.current.delete(node.id);
        pendingUploadIdsRef.current.delete(node.id);
      }

      const entry: ImageDeleteUndoEntry = {
        nodes: nodesToRemove,
        selectedIds: nodesToRemove
          .filter((node) => selectedImageIdsRef.current.includes(node.id))
          .map((node) => node.id),
        pendingByNodeId,
      };

      imageDeleteUndoStackRef.current.push(entry);

      while (imageDeleteUndoStackRef.current.length > IMAGE_DELETE_UNDO_LIMIT) {
        const flushed = imageDeleteUndoStackRef.current.shift();

        if (flushed) {
          commitImageDeleteEntry(flushed);
        }
      }

      applyImageDeleteEntryToCanvas(entry);
      saveDelayMsRef.current = 0;
    },
    [
      applyImageDeleteEntryToCanvas,
      commitImageDeleteEntry,
      flushImageDeleteRedoStack,
    ],
  );

  const undoImageDelete = useCallback(() => {
    const entry = imageDeleteUndoStackRef.current.pop();

    if (!entry) {
      return;
    }

    imageDeleteRedoStackRef.current.push(entry);

    for (const [nodeId, pending] of Object.entries(entry.pendingByNodeId)) {
      pendingUploadFilesRef.current.set(nodeId, pending);
      pendingUploadIdsRef.current.add(nodeId);
    }

    setImageNodes((current) => {
      const existingIds = new Set(current.map((node) => node.id));
      const restored = entry.nodes.filter((node) => !existingIds.has(node.id));

      return [...current, ...restored].sort((a, b) => a.zIndex - b.zIndex);
    });
    setSelectedImageIds(entry.selectedIds);
    saveDelayMsRef.current = 0;
  }, []);

  const redoImageDelete = useCallback(() => {
    const entry = imageDeleteRedoStackRef.current.pop();

    if (!entry) {
      return;
    }

    imageDeleteUndoStackRef.current.push(entry);

    while (imageDeleteUndoStackRef.current.length > IMAGE_DELETE_UNDO_LIMIT) {
      const flushed = imageDeleteUndoStackRef.current.shift();

      if (flushed) {
        commitImageDeleteEntry(flushed);
      }
    }

    applyImageDeleteEntryToCanvas(entry);
    saveDelayMsRef.current = 0;
  }, [applyImageDeleteEntryToCanvas, commitImageDeleteEntry]);

  const applyRemoteCanvasUpdate = useCallback(
    (content: CanvasContent, updatedAt: string, name: string) => {
      if (Date.parse(updatedAt) <= Date.parse(lastServerUpdatedAtRef.current)) {
        return;
      }

      isApplyingRemoteUpdateRef.current = true;
      imageDeleteUndoStackRef.current = [];
      imageDeleteRedoStackRef.current = [];

      const mergedImageNodes = mergeRemoteImageNodes(
        imageNodesRef.current,
        content.imageNodes,
      );
      const keptBlobUrls = new Set(
        mergedImageNodes
          .filter((node) => node.url.startsWith("blob:"))
          .map((node) => node.url),
      );

      for (const node of imageNodesRef.current) {
        if (node.url.startsWith("blob:") && !keptBlobUrls.has(node.url)) {
          URL.revokeObjectURL(node.url);
          pendingUploadFilesRef.current.delete(node.id);
          pendingUploadIdsRef.current.delete(node.id);
        }
      }

      setViewport(content.viewport);
      setShowGrid(content.showGrid);
      setBackgroundColor(content.backgroundColor);
      setGridColor(content.gridColor);
      setGridSize(content.gridSize);
      setImageNodes(mergedImageNodes);
      setWebNodes(content.webNodes);
      setVoiceNodes(content.voiceNodes);
      imageNodesRef.current = mergedImageNodes;
      webNodesRef.current = content.webNodes;
      voiceNodesRef.current = content.voiceNodes;
      setSelectedImageIds([]);
      lastServerUpdatedAtRef.current = updatedAt;
      serverUpdatedAtRef.current = updatedAt;
      skipSaveRef.current = true;
      markLocalCanvasDraftSynced(
        canvasId,
        { ...content, imageNodes: mergedImageNodes },
        updatedAt,
      );
      onRemoteNameChange?.(name);

      window.requestAnimationFrame(() => {
        isApplyingRemoteUpdateRef.current = false;
      });
    },
    [canvasId, onRemoteNameChange],
  );

  useEffect(() => {
    selectedImageIdsRef.current = selectedImageIds;
  }, [selectedImageIds]);

  useEffect(() => {
    imageNodesRef.current = imageNodes;
  }, [imageNodes]);

  useEffect(() => {
    webNodesRef.current = webNodes;
  }, [webNodes]);

  useEffect(() => {
    voiceNodesRef.current = voiceNodes;
  }, [voiceNodes]);

  useEffect(() => {
    function handleVoiceNoteRecorded(event: Event) {
      const detail = (event as CustomEvent<VoiceNoteRecordedDetail>).detail;

      if (!detail) {
        return;
      }

      setPendingVoiceRecording(detail);
    }

    window.addEventListener(VOICE_NOTE_RECORDED_EVENT, handleVoiceNoteRecorded);

    return () => {
      window.removeEventListener(
        VOICE_NOTE_RECORDED_EVENT,
        handleVoiceNoteRecorded,
      );
    };
  }, []);

  useEffect(() => {
    if (!pendingVoiceRecording || !isClientReady) {
      return;
    }

    const rect = canvasRef.current?.getBoundingClientRect();

    if (!rect) {
      setPendingVoiceRecording(null);
      return;
    }

    void (async () => {
      let audioDataUrl: string;
      try {
        audioDataUrl = await blobToDataUrl(pendingVoiceRecording.blob);
      } catch {
        setPendingVoiceRecording(null);
        return;
      }
      const center = {
        x: (rect.width / 2 - viewport.x) / viewport.zoom,
        y: (rect.height / 2 - viewport.y) / viewport.zoom,
      };
      const topZIndex = Math.max(
        0,
        ...imageNodesRef.current.map((node) => node.zIndex),
        ...webNodesRef.current.map((node) => node.zIndex),
        ...voiceNodesRef.current.map((node) => node.zIndex),
      );

      setVoiceNodes((current) => [
        ...current,
        {
          id: pendingVoiceRecording.id,
          title: formatVoiceNoteTitle(pendingVoiceRecording.durationMs),
          audioDataUrl,
          durationMs: pendingVoiceRecording.durationMs,
          position: {
            x: center.x - 120,
            y: center.y - 56,
          },
          size: {
            width: 240,
            height: 112,
          },
          zIndex: topZIndex + 1,
        },
      ]);
      saveDelayMsRef.current = 0;
      setPendingVoiceRecording(null);
    })();
  }, [
    isClientReady,
    pendingVoiceRecording,
    viewport.x,
    viewport.y,
    viewport.zoom,
  ]);

  useEffect(() => {
    if (!isClientReady) {
      return;
    }

    if (initialImageCount === 0) {
      setIsCanvasLoading(false);
    }
  }, [initialImageCount, isClientReady]);

  useEffect(() => {
    if (!isCanvasLoading) {
      return;
    }

    if (settledInitialImageIds.size < initialImageCount) {
      return;
    }

    const firstFrame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => setIsCanvasLoading(false));
    });

    return () => {
      window.cancelAnimationFrame(firstFrame);
    };
  }, [initialImageCount, isCanvasLoading, settledInitialImageIds.size]);

  useEffect(() => {
    if (!isCanvasLoading) {
      return;
    }

    const fallbackTimer = window.setTimeout(() => {
      setIsCanvasLoading(false);
    }, 8000);

    return () => {
      window.clearTimeout(fallbackTimer);
    };
  }, [isCanvasLoading]);

  useEffect(() => {
    if (!isCanvasLoading) {
      return;
    }

    const emptyInitialIds = imageNodes
      .filter(
        (node) =>
          initialImageIdsRef.current.has(node.id) &&
          getImageNodeSrc(node) === null,
      )
      .map((node) => node.id);

    if (emptyInitialIds.length === 0) {
      return;
    }

    setSettledInitialImageIds((current) => {
      const next = new Set(current);
      let changed = false;

      for (const nodeId of emptyInitialIds) {
        if (!next.has(nodeId)) {
          next.add(nodeId);
          changed = true;
        }
      }

      return changed ? next : current;
    });
  }, [imageNodes, isCanvasLoading]);

  const buildCanvasContent = useCallback((): CanvasContent => {
    return {
      version: 1,
      viewport,
      imageNodes: imageNodes.map(serializeImageNodeForSave),
      webNodes,
      voiceNodes,
      showGrid,
      backgroundColor,
      gridColor,
      gridSize,
    };
  }, [
    backgroundColor,
    gridColor,
    gridSize,
    imageNodes,
    showGrid,
    viewport,
    webNodes,
    voiceNodes,
  ]);

  const buildCanvasContentRef = useRef(buildCanvasContent);
  buildCanvasContentRef.current = buildCanvasContent;

  const serverUpdatedAtRef = useRef(serverUpdatedAt);
  serverUpdatedAtRef.current = serverUpdatedAt;
  lastServerUpdatedAtRef.current = serverUpdatedAt;

  const persistCanvasToCloud = useCallback(async () => {
    if (!isClientReady || isApplyingRemoteUpdateRef.current) {
      return;
    }

    if (imageNodesRef.current.some((node) => isPendingCloudSync(node))) {
      return;
    }

    const content = buildCanvasContentRef.current();

    writeLocalCanvasDraft(canvasId, content, serverUpdatedAtRef.current);

    try {
      const response = await fetch(`/api/canvases/${canvasId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          name: canvasName,
        }),
      });

      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as { updated_at?: string };

      if (data.updated_at) {
        lastServerUpdatedAtRef.current = data.updated_at;
        serverUpdatedAtRef.current = data.updated_at;
        markLocalCanvasDraftSynced(canvasId, content, data.updated_at);
      }
    } catch {
      // Keep the local draft dirty so the next page load can recover it.
    }
  }, [canvasId, canvasName, isClientReady]);

  useEffect(() => {
    if (!isClientReady) {
      return;
    }

    if (skipSaveRef.current) {
      skipSaveRef.current = false;
      return;
    }

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    let delay = saveDelayMsRef.current;
    saveDelayMsRef.current = 1200;

    if (pendingUploadIdsRef.current.size > 0) {
      delay = Math.max(delay, 3500);
    }

    saveTimerRef.current = setTimeout(() => {
      void persistCanvasToCloud();
    }, delay);

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [buildCanvasContent, isClientReady, persistCanvasToCloud]);

  useEffect(() => {
    if (!isClientReady) {
      return;
    }

    const supabase = supabaseClientRef.current;

    return subscribeToCanvasUpdates(supabase, canvasId, (update) => {
      applyRemoteCanvasUpdate(update.content, update.updatedAt, update.name);
    });
  }, [applyRemoteCanvasUpdate, canvasId, isClientReady]);

  useEffect(() => {
    if (!isClientReady) {
      return;
    }

    async function pullRemoteIfNewer() {
      const update = await fetchRemoteCanvasUpdate(canvasId);

      if (!update) {
        return;
      }

      applyRemoteCanvasUpdate(update.content, update.updatedAt, update.name);
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        void pullRemoteIfNewer();
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [applyRemoteCanvasUpdate, canvasId, isClientReady]);

  useEffect(() => {
    function commitPendingImageDeletes() {
      for (const entry of imageDeleteUndoStackRef.current) {
        commitImageDeleteEntry(entry);
      }

      for (const entry of imageDeleteRedoStackRef.current) {
        commitImageDeleteEntry(entry);
      }

      imageDeleteUndoStackRef.current = [];
      imageDeleteRedoStackRef.current = [];
    }

    function flushDraft() {
      writeLocalCanvasDraft(
        canvasId,
        buildCanvasContentRef.current(),
        serverUpdatedAtRef.current,
      );
    }

    function handlePageExit() {
      commitPendingImageDeletes();
      flushDraft();
    }

    function handleVisibilityHidden() {
      if (document.visibilityState === "hidden") {
        flushDraft();
      }
    }

    window.addEventListener("beforeunload", handlePageExit);
    window.addEventListener("pagehide", handlePageExit);
    document.addEventListener("visibilitychange", handleVisibilityHidden);

    return () => {
      window.removeEventListener("beforeunload", handlePageExit);
      window.removeEventListener("pagehide", handlePageExit);
      document.removeEventListener("visibilitychange", handleVisibilityHidden);
      handlePageExit();
    };
  }, [canvasId, commitImageDeleteEntry]);

  useEffect(() => {
    function handleGlobalPointerDown() {
      setOpenVoiceMenuNodeId(null);
    }

    function handleGlobalEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenVoiceMenuNodeId(null);
      }
    }

    window.addEventListener("pointerdown", handleGlobalPointerDown);
    window.addEventListener("keydown", handleGlobalEscape);

    return () => {
      window.removeEventListener("pointerdown", handleGlobalPointerDown);
      window.removeEventListener("keydown", handleGlobalEscape);
    };
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target;

      if (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA")
      ) {
        return;
      }

      if (event.key === "Escape") {
        setSelectedImageIds([]);
        setMarquee(null);
        return;
      }

      const primaryModifier = event.metaKey || event.ctrlKey;
      const isUndoKey =
        event.code === "KeyZ" || event.key === "z" || event.key === "Z";

      if (primaryModifier && isUndoKey && !event.shiftKey) {
        event.preventDefault();
        event.stopPropagation();
        undoImageDelete();
        return;
      }

      if (primaryModifier && isUndoKey && event.shiftKey) {
        event.preventDefault();
        event.stopPropagation();
        redoImageDelete();
        return;
      }

      if (event.key === "Delete" || event.key === "Backspace") {
        const selectedIds = imageNodesRef.current
          .filter((node) => selectedImageIdSet.has(node.id))
          .map((node) => node.id);

        if (selectedIds.length > 0) {
          event.preventDefault();
          removeImageNodes(selectedIds);
        }

        return;
      }

      const selectAll = event.key === "a" && (event.metaKey || event.ctrlKey);

      if (selectAll) {
        event.preventDefault();
        setSelectedImageIds(imageNodesRef.current.map((node) => node.id));
        return;
      }

      const isDuplicateKey =
        event.key === "d" && (event.metaKey || event.ctrlKey);

      if (isDuplicateKey) {
        event.preventDefault();
        event.stopPropagation();

        const selectedNodes = imageNodesRef.current.filter((node) =>
          selectedImageIdSet.has(node.id),
        );

        if (selectedNodes.length > 0) {
          const duplicatedNodes = selectedNodes.map((node) => ({
            ...node,
            id: crypto.randomUUID(),
            position: {
              x: node.position.x + 20,
              y: node.position.y + 20,
            },
            zIndex: Math.max(...imageNodesRef.current.map((n) => n.zIndex)) + 1,
          }));

          setImageNodes((current) => [...current, ...duplicatedNodes]);
          setSelectedImageIds(duplicatedNodes.map((node) => node.id));
        }

        return;
      }
    }

    window.addEventListener("keydown", handleKeyDown, { capture: true });

    return () => {
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
    };
  }, [
    redoImageDelete,
    removeImageNodes,
    selectedImageIdSet,
    undoImageDelete,
    setImageNodes,
  ]);

  useEffect(() => {
    function preventFileNavigation(event: DragEvent) {
      if (!event.dataTransfer?.types.includes("Files")) {
        return;
      }

      event.preventDefault();
    }

    window.addEventListener("dragover", preventFileNavigation);
    window.addEventListener("drop", preventFileNavigation);

    return () => {
      window.removeEventListener("dragover", preventFileNavigation);
      window.removeEventListener("drop", preventFileNavigation);
      imageNodesRef.current.forEach((node) => {
        if (node.url.startsWith("blob:")) {
          URL.revokeObjectURL(node.url);
        }
      });
      cleanupAllAudio();
    };
  }, [cleanupAllAudio]);

  useEffect(() => {
    function handleWindowPaste(event: ClipboardEvent) {
      const pastedText = event.clipboardData?.getData("text/plain") ?? "";
      const url = getUrlFromText(pastedText);

      if (!url) {
        return;
      }

      const rect = canvasRef.current?.getBoundingClientRect();

      if (!rect) {
        return;
      }

      event.preventDefault();

      const center = screenToCanvas({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      });
      const topZIndex = Math.max(
        0,
        ...imageNodesRef.current.map((node) => node.zIndex),
        ...webNodesRef.current.map((node) => node.zIndex),
        ...voiceNodesRef.current.map((node) => node.zIndex),
      );

      setWebNodes((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          url,
          title: getWebsiteTitle(url),
          position: {
            x: center.x - 130,
            y: center.y - 170,
          },
          size: {
            width: 260,
            height: 340,
          },
          zIndex: topZIndex + 1,
        },
      ]);
    }

    window.addEventListener("paste", handleWindowPaste);

    return () => {
      window.removeEventListener("paste", handleWindowPaste);
    };
  });

  const gridStyle = useMemo<CSSProperties>(() => {
    const scaledSize = gridSize * viewport.zoom;
    const gridColorValue = `${gridColor}66`;

    if (!showGrid) {
      return { backgroundColor };
    }

    return {
      backgroundColor,
      backgroundImage: `linear-gradient(${gridColorValue} 1px, transparent 1px), linear-gradient(90deg, ${gridColorValue} 1px, transparent 1px)`,
      backgroundPosition: `${viewport.x}px ${viewport.y}px`,
      backgroundSize: `${scaledSize}px ${scaledSize}px`,
    };
  }, [backgroundColor, gridColor, gridSize, showGrid, viewport]);

  function handleWheel(event: WheelEvent<HTMLDivElement>) {
    event.preventDefault();

    if (event.ctrlKey || event.metaKey) {
      updateZoomKeepingScreenPoint(
        { x: event.clientX, y: event.clientY },
        (currentZoom) => currentZoom * Math.exp(-event.deltaY * 0.0015),
      );
      return;
    }

    setViewport((current) => ({
      ...current,
      x: current.x - event.deltaX,
      y: current.y - event.deltaY,
    }));
  }

  function screenToCanvas(point: Point) {
    const rect = canvasRef.current?.getBoundingClientRect();

    if (!rect) {
      return point;
    }

    return {
      x: (point.x - rect.left - viewport.x) / viewport.zoom,
      y: (point.y - rect.top - viewport.y) / viewport.zoom,
    };
  }

  function getTopZIndex() {
    return Math.max(
      0,
      ...imageNodesRef.current.map((node) => node.zIndex),
      ...webNodesRef.current.map((node) => node.zIndex),
      ...voiceNodesRef.current.map((node) => node.zIndex),
    );
  }

  function focusCanvasBounds(bounds: {
    position: Point;
    size: { width: number; height: number };
  }) {
    const rect = canvasRef.current?.getBoundingClientRect();

    if (!rect) {
      return;
    }

    const padding = 160;
    const zoom = clamp(
      Math.min(
        (rect.width - padding) / Math.max(bounds.size.width, 1),
        (rect.height - padding) / Math.max(bounds.size.height, 1),
        2,
      ),
      MIN_ZOOM,
      MAX_ZOOM,
    );
    const centerX = bounds.position.x + bounds.size.width / 2;
    const centerY = bounds.position.y + bounds.size.height / 2;

    setViewport({
      x: rect.width / 2 - centerX * zoom,
      y: rect.height / 2 - centerY * zoom,
      zoom,
    });
  }

  function focusCanvasItem(item: CanvasContentsItem) {
    const node =
      item.kind === "image"
        ? imageNodesRef.current.find((entry) => entry.id === item.id)
        : item.kind === "website"
          ? webNodesRef.current.find((entry) => entry.id === item.id)
          : voiceNodesRef.current.find((entry) => entry.id === item.id);

    if (!node) {
      return;
    }

    focusCanvasBounds({
      position: node.position,
      size: node.size,
    });

    setSelectedImageIds(item.kind === "image" ? [item.id] : []);
    setActiveWebNodeId(null);
    setShowContentsPanel(false);
  }

  function fitContentToView() {
    const rect = canvasRef.current?.getBoundingClientRect();

    if (!rect) {
      return;
    }

    const nodes = [
      ...imageNodesRef.current.map((node) => ({
        x: node.position.x,
        y: node.position.y,
        width: node.size.width,
        height: node.size.height,
      })),
      ...webNodesRef.current.map((node) => ({
        x: node.position.x,
        y: node.position.y,
        width: node.size.width,
        height: node.size.height,
      })),
      ...voiceNodesRef.current.map((node) => ({
        x: node.position.x,
        y: node.position.y,
        width: node.size.width,
        height: node.size.height,
      })),
    ];

    if (nodes.length === 0) {
      setViewport({ x: 0, y: 0, zoom: 1 });
      return;
    }

    const padding = 64;
    const minX = Math.min(...nodes.map((node) => node.x));
    const minY = Math.min(...nodes.map((node) => node.y));
    const maxX = Math.max(...nodes.map((node) => node.x + node.width));
    const maxY = Math.max(...nodes.map((node) => node.y + node.height));
    const contentWidth = Math.max(maxX - minX, 1);
    const contentHeight = Math.max(maxY - minY, 1);
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const availableWidth = Math.max(rect.width - padding * 2, 1);
    const availableHeight = Math.max(rect.height - padding * 2, 1);
    const zoom = clamp(
      Math.min(availableWidth / contentWidth, availableHeight / contentHeight),
      MIN_ZOOM,
      MAX_ZOOM,
    );

    setViewport({
      x: rect.width / 2 - centerX * zoom,
      y: rect.height / 2 - centerY * zoom,
      zoom,
    });
  }

  function updateZoomKeepingScreenPoint(
    screenPoint: Point,
    getNextZoom: (currentZoom: number) => number,
  ) {
    const rect = canvasRef.current?.getBoundingClientRect();

    setViewport((current) => {
      const zoom = clamp(getNextZoom(current.zoom), MIN_ZOOM, MAX_ZOOM);

      if (!rect) {
        return { ...current, zoom };
      }

      const anchor = {
        x: (screenPoint.x - rect.left - current.x) / current.zoom,
        y: (screenPoint.y - rect.top - current.y) / current.zoom,
      };

      return {
        x: screenPoint.x - rect.left - anchor.x * zoom,
        y: screenPoint.y - rect.top - anchor.y * zoom,
        zoom,
      };
    });
  }

  function updateZoomKeepingCenter(
    getNextZoom: (currentZoom: number) => number,
  ) {
    const rect = canvasRef.current?.getBoundingClientRect();

    if (!rect) {
      updateZoomKeepingScreenPoint({ x: 0, y: 0 }, getNextZoom);
      return;
    }

    updateZoomKeepingScreenPoint(
      {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      },
      getNextZoom,
    );
  }

  function zoomIn() {
    updateZoomKeepingCenter((currentZoom) => currentZoom * ZOOM_SCALE_FACTOR);
  }

  function zoomOut() {
    updateZoomKeepingCenter((currentZoom) => currentZoom / ZOOM_SCALE_FACTOR);
  }

  function resetZoom() {
    updateZoomKeepingCenter(() => 1);
  }

  function handleInitialImageSettled(nodeId: string) {
    if (!initialImageIdsRef.current.has(nodeId)) {
      return;
    }

    setSettledInitialImageIds((current) => {
      if (current.has(nodeId)) {
        return current;
      }

      const next = new Set(current);
      next.add(nodeId);
      return next;
    });
  }

  function handleDragEnter(event: ReactDragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setIsFileDragging(true);
  }

  function handleDragOver(event: ReactDragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setIsFileDragging(true);
  }

  function handleDragLeave(event: ReactDragEvent<HTMLDivElement>) {
    if (event.currentTarget === event.target) {
      setIsFileDragging(false);
    }
  }

  async function syncImageToStorage(
    nodeId: string,
    file: File,
    blobUrl: string,
  ) {
    const maxAttempts = 3;

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      try {
        const uploaded = await withTimeout(
          uploadCanvasImage(
            supabaseClientRef.current,
            userId,
            canvasId,
            nodeId,
            file,
          ),
          120_000,
          "Upload timed out",
        );

        pendingUploadIdsRef.current.delete(nodeId);

        setImageNodes((current) =>
          current.map((node) =>
            node.id === nodeId
              ? {
                  ...node,
                  url: uploaded.url,
                  storagePath: uploaded.storagePath,
                }
              : node,
          ),
        );

        URL.revokeObjectURL(blobUrl);
        pendingUploadFilesRef.current.delete(nodeId);
        await deletePendingUploadFile(canvasId, nodeId);
        return;
      } catch (error) {
        const debugEntry = createUploadDebugEntry(
          nodeId,
          file.name,
          attempt + 1,
          error,
        );

        if (process.env.NODE_ENV === "development") {
          logUploadDebug(debugEntry);
        }

        onUploadDebugEntry?.(debugEntry);

        if (attempt < maxAttempts - 1) {
          await sleep(1000 * (attempt + 1));
        }
      }
    }

    // Keep blob preview + IndexedDB so a later visit can retry the upload.
  }

  function addDroppedImageFile(
    file: File,
    index: number,
    dropPosition: Point,
    topZIndex: number,
  ) {
    const nodeId = crypto.randomUUID();
    const blobUrl = URL.createObjectURL(file);
    const placeholderSize = fitImageSize(320, 240);

    pendingUploadFilesRef.current.set(nodeId, { file, blobUrl });
    pendingUploadIdsRef.current.add(nodeId);

    setImageNodes((current) => [
      ...current,
      {
        id: nodeId,
        fileName: file.name,
        url: blobUrl,
        position: {
          x: dropPosition.x + index * 20,
          y: dropPosition.y + index * 20,
        },
        size: placeholderSize,
        zIndex: topZIndex + index + 1,
      },
    ]);

    canvasImageUploadPool.enqueue(() =>
      syncImageToStorage(nodeId, file, blobUrl),
    );

    void (async () => {
      try {
        await savePendingUploadFile(canvasId, nodeId, file);
      } catch {
        // Upload can still proceed from memory.
      }

      const naturalSize = await getNaturalImageSize(blobUrl);

      setImageNodes((current) =>
        current.map((node) =>
          node.id === nodeId
            ? {
                ...node,
                size: fitImageSize(naturalSize.width, naturalSize.height),
              }
            : node,
        ),
      );
    })();

    return nodeId;
  }

  async function handleDrop(event: ReactDragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    setIsFileDragging(false);

    const files = Array.from(event.dataTransfer.files).filter((file) =>
      file.type.startsWith("image/"),
    );

    if (files.length === 0) {
      return;
    }

    const dropPosition = screenToCanvas({
      x: event.clientX,
      y: event.clientY,
    });

    const topZIndex = imageNodesRef.current.reduce(
      (max, node) => Math.max(max, node.zIndex),
      Math.max(
        0,
        ...webNodesRef.current.map((node) => node.zIndex),
        ...voiceNodesRef.current.map((node) => node.zIndex),
      ),
    );

    const addedIds: string[] = [];

    for (let index = 0; index < files.length; index += 1) {
      const nodeId = addDroppedImageFile(
        files[index],
        index,
        dropPosition,
        topZIndex,
      );

      addedIds.push(nodeId);
    }

    if (addedIds.length >= 2) {
      setSelectedImageIds(addedIds);
    }

    saveDelayMsRef.current = 0;
  }

  function applyImageLayout(request: LayoutArrangeRequest) {
    const selected = imageNodes.filter((node) =>
      selectedImageIdSet.has(node.id),
    );

    if (selected.length < 2) {
      return;
    }

    const origin = getSelectionOrigin(selected);
    const layouts = arrangeImagesFromRequest(
      selected.map((node) => ({
        id: node.id,
        width: node.size.width,
        height: node.size.height,
      })),
      origin,
      request,
    );
    const layoutById = new Map(layouts.map((entry) => [entry.id, entry]));

    setImageNodes((current) =>
      current.map((node) => {
        const layout = layoutById.get(node.id);

        if (!layout) {
          return node;
        }

        return {
          ...node,
          position: layout.position,
          size: layout.size,
        };
      }),
    );
  }

  function handleCanvasPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget || event.button !== 0) {
      return;
    }

    event.preventDefault();
    setShowGridControls(false);
    setShowContentsPanel(false);

    const point = screenToCanvas({ x: event.clientX, y: event.clientY });

    event.currentTarget.setPointerCapture(event.pointerId);

    const additive = event.shiftKey || event.metaKey || event.ctrlKey;

    setMarquee({
      start: point,
      current: point,
      additive,
    });

    if (!additive) {
      setSelectedImageIds([]);
    }

    setActiveWebNodeId(null);
  }

  function handleCanvasPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!marquee) {
      return;
    }

    setMarquee((current) =>
      current
        ? {
            ...current,
            current: screenToCanvas({ x: event.clientX, y: event.clientY }),
          }
        : null,
    );
  }

  function handleCanvasPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (!marquee) {
      return;
    }

    const rect = normalizeRect(marquee.start, marquee.current);
    const hitIds = imageNodesRef.current
      .filter((node) => imageIntersectsRect(node, rect))
      .map((node) => node.id);

    if (rect.width > 4 || rect.height > 4) {
      setSelectedImageIds((current) =>
        marquee.additive ? [...new Set([...current, ...hitIds])] : hitIds,
      );
    }

    setMarquee(null);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function handleImagePointerDown(
    event: ReactPointerEvent<HTMLDivElement>,
    node: ImageCanvasNode,
  ) {
    if (imageResizeRef.current) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);

    const additive = event.shiftKey || event.metaKey || event.ctrlKey;
    const isSelected = selectedImageIdSet.has(node.id);
    let idsToDrag: string[];

    if (additive && isSelected) {
      setSelectedImageIds((current) => current.filter((id) => id !== node.id));
      return;
    }

    if (additive) {
      idsToDrag = [...selectedImageIds, node.id];
      setSelectedImageIds(idsToDrag);
    } else if (!isSelected) {
      idsToDrag = [node.id];
      setSelectedImageIds(idsToDrag);
    } else if (selectedImageIds.length > 1) {
      idsToDrag = selectedImageIds;
    } else {
      idsToDrag = [node.id];
    }
    const point = screenToCanvas({ x: event.clientX, y: event.clientY });
    const startPositions = Object.fromEntries(
      imageNodesRef.current
        .filter((entry) => idsToDrag.includes(entry.id))
        .map((entry) => [entry.id, entry.position]),
    );

    imageDragRef.current = {
      anchorId: node.id,
      offset: {
        x: point.x - node.position.x,
        y: point.y - node.position.y,
      },
      nodeIds: idsToDrag,
      startPositions,
    };
    setDraggingImageNodeId(node.id);

    setImageNodes((current) => {
      const topZIndex = current.reduce(
        (max, entry) => Math.max(max, entry.zIndex),
        0,
      );

      return current.map((entry) =>
        entry.id === node.id ? { ...entry, zIndex: topZIndex + 1 } : entry,
      );
    });
  }

  function getResizedNodeBounds(
    resizeState: NodeResizeState,
    point: Point,
  ): { position: Point; size: { width: number; height: number } } {
    const deltaX = point.x - resizeState.startPoint.x;
    const deltaY = point.y - resizeState.startPoint.y;
    const horizontalSign = resizeState.corner.includes("right") ? 1 : -1;
    const verticalSign = resizeState.corner.includes("bottom") ? 1 : -1;
    const minSize = resizeState.lockAspectRatio ? 40 : 120;

    let nextWidth = resizeState.startSize.width + deltaX * horizontalSign;
    let nextHeight = resizeState.startSize.height + deltaY * verticalSign;

    if (resizeState.lockAspectRatio) {
      const ratio = resizeState.startSize.width / resizeState.startSize.height;
      const widthFromX = resizeState.startSize.width + deltaX * horizontalSign;
      const widthFromY =
        resizeState.startSize.width + deltaY * verticalSign * ratio;
      nextWidth =
        Math.abs(widthFromX) > Math.abs(widthFromY) ? widthFromX : widthFromY;
      nextHeight = nextWidth / ratio;
    }

    nextWidth = Math.max(minSize, Math.round(nextWidth));
    nextHeight = Math.max(minSize, Math.round(nextHeight));

    const nextPosition = { ...resizeState.startPosition };

    if (resizeState.corner.includes("left")) {
      nextPosition.x =
        resizeState.startPosition.x + resizeState.startSize.width - nextWidth;
    }

    if (resizeState.corner.includes("top")) {
      nextPosition.y =
        resizeState.startPosition.y + resizeState.startSize.height - nextHeight;
    }

    return {
      position: nextPosition,
      size: { width: nextWidth, height: nextHeight },
    };
  }

  function handleImagePointerMove(event: ReactPointerEvent<HTMLElement>) {
    const dragState = imageDragRef.current;
    const resizeState = imageResizeRef.current;

    if (resizeState) {
      const point = screenToCanvas({ x: event.clientX, y: event.clientY });
      const bounds = getResizedNodeBounds(resizeState, point);

      setImageNodes((current) =>
        current.map((node) =>
          node.id === resizeState.nodeId
            ? { ...node, position: bounds.position, size: bounds.size }
            : node,
        ),
      );

      return;
    }

    if (!dragState) {
      return;
    }

    const point = screenToCanvas({ x: event.clientX, y: event.clientY });
    const anchorStart = dragState.startPositions[dragState.anchorId];

    if (!anchorStart) {
      return;
    }

    const anchorPosition = {
      x: point.x - dragState.offset.x,
      y: point.y - dragState.offset.y,
    };
    const delta = {
      x: anchorPosition.x - anchorStart.x,
      y: anchorPosition.y - anchorStart.y,
    };

    setImageNodes((current) =>
      current.map((node) => {
        if (!dragState.nodeIds.includes(node.id)) {
          return node;
        }

        const start = dragState.startPositions[node.id];

        if (!start) {
          return node;
        }

        return {
          ...node,
          position: {
            x: start.x + delta.x,
            y: start.y + delta.y,
          },
        };
      }),
    );
  }

  function handleImagePointerUp(event: ReactPointerEvent<HTMLElement>) {
    imageDragRef.current = null;
    imageResizeRef.current = null;
    setDraggingImageNodeId(null);
    setResizingImageNodeId(null);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function handleWebPointerDown(
    event: ReactPointerEvent<HTMLDivElement>,
    node: WebCanvasNode,
  ) {
    if (webResizeRef.current) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);

    const point = screenToCanvas({ x: event.clientX, y: event.clientY });
    webDragRef.current = {
      nodeId: node.id,
      offset: {
        x: point.x - node.position.x,
        y: point.y - node.position.y,
      },
      startPoint: point,
      hasMoved: false,
    };
    setDraggingWebNodeId(node.id);

    setWebNodes((current) => {
      const topZIndex = Math.max(
        0,
        ...imageNodesRef.current.map((entry) => entry.zIndex),
        ...current.map((entry) => entry.zIndex),
        ...voiceNodesRef.current.map((entry) => entry.zIndex),
      );

      return current.map((entry) =>
        entry.id === node.id ? { ...entry, zIndex: topZIndex + 1 } : entry,
      );
    });
  }

  function handleWebPointerMove(event: ReactPointerEvent<HTMLElement>) {
    const resizeState = webResizeRef.current;

    if (resizeState) {
      const point = screenToCanvas({ x: event.clientX, y: event.clientY });
      const bounds = getResizedNodeBounds(resizeState, point);

      setWebNodes((current) =>
        current.map((node) =>
          node.id === resizeState.nodeId
            ? { ...node, position: bounds.position, size: bounds.size }
            : node,
        ),
      );

      return;
    }

    const dragState = webDragRef.current;

    if (!dragState) {
      return;
    }

    const point = screenToCanvas({ x: event.clientX, y: event.clientY });
    const moveDistance = Math.hypot(
      point.x - dragState.startPoint.x,
      point.y - dragState.startPoint.y,
    );

    if (moveDistance > 4) {
      dragState.hasMoved = true;
    }

    setWebNodes((current) =>
      current.map((node) =>
        node.id === dragState.nodeId
          ? {
              ...node,
              position: {
                x: point.x - dragState.offset.x,
                y: point.y - dragState.offset.y,
              },
            }
          : node,
      ),
    );
  }

  function handleWebPointerUp(event: ReactPointerEvent<HTMLElement>) {
    const didDrag = webDragRef.current?.hasMoved ?? false;
    const didResize = webResizeRef.current !== null;
    webDragRef.current = null;
    webResizeRef.current = null;
    setDraggingWebNodeId(null);
    setResizingWebNodeId(null);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    return { didDrag, didResize };
  }

  function handleImageResizePointerDown(
    event: ReactPointerEvent<HTMLButtonElement>,
    node: ImageCanvasNode,
    corner: ResizeCorner,
  ) {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);

    imageDragRef.current = null;
    imageResizeRef.current = {
      nodeId: node.id,
      corner,
      startPoint: screenToCanvas({ x: event.clientX, y: event.clientY }),
      startPosition: node.position,
      startSize: node.size,
      lockAspectRatio: true,
    };
    setDraggingImageNodeId(null);
    setResizingImageNodeId(node.id);

    setImageNodes((current) => {
      const topZIndex = current.reduce(
        (max, entry) => Math.max(max, entry.zIndex),
        0,
      );

      return current.map((entry) =>
        entry.id === node.id ? { ...entry, zIndex: topZIndex + 1 } : entry,
      );
    });
  }

  function handleWebResizePointerDown(
    event: ReactPointerEvent<HTMLButtonElement>,
    node: WebCanvasNode,
    corner: ResizeCorner,
  ) {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);

    webDragRef.current = null;
    webResizeRef.current = {
      nodeId: node.id,
      corner,
      startPoint: screenToCanvas({ x: event.clientX, y: event.clientY }),
      startPosition: node.position,
      startSize: node.size,
      lockAspectRatio: false,
    };
    setDraggingWebNodeId(null);
    setResizingWebNodeId(node.id);

    setWebNodes((current) => {
      const topZIndex = Math.max(
        0,
        ...imageNodesRef.current.map((entry) => entry.zIndex),
        ...current.map((entry) => entry.zIndex),
      );

      return current.map((entry) =>
        entry.id === node.id ? { ...entry, zIndex: topZIndex + 1 } : entry,
      );
    });
  }

  function handleVoicePointerDown(
    event: ReactPointerEvent<HTMLDivElement>,
    node: VoiceCanvasNode,
  ) {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);

    const point = screenToCanvas({ x: event.clientX, y: event.clientY });
    voiceDragRef.current = {
      nodeId: node.id,
      offset: {
        x: point.x - node.position.x,
        y: point.y - node.position.y,
      },
    };
    setDraggingVoiceNodeId(node.id);

    setVoiceNodes((current) => {
      const topZIndex = Math.max(
        0,
        ...imageNodesRef.current.map((entry) => entry.zIndex),
        ...webNodesRef.current.map((entry) => entry.zIndex),
        ...current.map((entry) => entry.zIndex),
      );

      return current.map((entry) =>
        entry.id === node.id ? { ...entry, zIndex: topZIndex + 1 } : entry,
      );
    });
  }

  function handleVoicePointerMove(event: ReactPointerEvent<HTMLElement>) {
    const dragState = voiceDragRef.current;

    if (!dragState) {
      return;
    }

    const point = screenToCanvas({ x: event.clientX, y: event.clientY });

    setVoiceNodes((current) =>
      current.map((node) =>
        node.id === dragState.nodeId
          ? {
              ...node,
              position: {
                x: point.x - dragState.offset.x,
                y: point.y - dragState.offset.y,
              },
            }
          : node,
      ),
    );
  }

  function handleVoicePointerUp(event: ReactPointerEvent<HTMLElement>) {
    voiceDragRef.current = null;
    setDraggingVoiceNodeId(null);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function handleDeleteVoiceNode(nodeId: string) {
    removeNodePlayback(nodeId);
    setVoiceNodes((current) => current.filter((node) => node.id !== nodeId));
    saveDelayMsRef.current = 0;
  }

  function handleVoiceNodeMenuAction(
    nodeId: string,
    action: VoiceNoteMenuAction,
  ) {
    if (action === "delete") {
      handleDeleteVoiceNode(nodeId);
      setOpenVoiceMenuNodeId(null);
      return;
    }

    setOpenVoiceMenuNodeId(null);
    const actionLabel = action === "transcribe" ? "Transcribe" : "Ask AI";
    window.alert(`${actionLabel} for voice notes is coming soon.`);
  }

  return (
    <div
      ref={canvasRef}
      className="absolute inset-0 overflow-hidden cursor-grab"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onWheel={handleWheel}
      style={gridStyle}
    >
      <div
        className="absolute inset-0"
        onPointerCancel={handleCanvasPointerUp}
        onPointerDown={handleCanvasPointerDown}
        onPointerMove={handleCanvasPointerMove}
        onPointerUp={handleCanvasPointerUp}
        style={{
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
          transformOrigin: "0 0",
        }}
      >
        {marqueeRect && (marqueeRect.width > 2 || marqueeRect.height > 2) && (
          <CanvasMarqueeSelection
            height={marqueeRect.height}
            width={marqueeRect.width}
            x={marqueeRect.x}
            y={marqueeRect.y}
          />
        )}

        {imageNodes.map((node) => {
          const isSelected = selectedImageIdSet.has(node.id);
          const showResizeHandles = isSelected && selectedImageIds.length === 1;
          const imageSrc = getImageNodeSrc(node);

          return (
            <CanvasImageNode
              key={node.id}
              imageSrc={imageSrc}
              isDragging={draggingImageNodeId === node.id}
              isResizing={resizingImageNodeId === node.id}
              isSelected={isSelected}
              node={node}
              showResizeHandles={showResizeHandles}
              onImageSettled={() => handleInitialImageSettled(node.id)}
              onPointerCancel={handleImagePointerUp}
              onPointerDown={(event) => handleImagePointerDown(event, node)}
              onPointerMove={handleImagePointerMove}
              onPointerUp={handleImagePointerUp}
              onResizePointerCancel={handleImagePointerUp}
              onResizePointerDown={(corner, event) =>
                handleImageResizePointerDown(event, node, corner)
              }
              onResizePointerMove={handleImagePointerMove}
              onResizePointerUp={handleImagePointerUp}
            />
          );
        })}

        {webNodes.map((node) => (
          <CanvasWebNode
            key={node.id}
            isDragging={draggingWebNodeId === node.id}
            isResizing={resizingWebNodeId === node.id}
            node={node}
            onPointerCancel={handleWebPointerUp}
            onPointerDown={(event) => handleWebPointerDown(event, node)}
            onPointerMove={handleWebPointerMove}
            onPointerUp={(event) => {
              const { didDrag, didResize } = handleWebPointerUp(event);

              if (!didDrag && !didResize) {
                setActiveWebNodeId(node.id);
              }
            }}
            onResizePointerCancel={handleWebPointerUp}
            onResizePointerDown={(corner, event) =>
              handleWebResizePointerDown(event, node, corner)
            }
            onResizePointerMove={handleWebPointerMove}
            onResizePointerUp={handleWebPointerUp}
          />
        ))}

        {voiceNodes.map((node) => (
          <CanvasVoiceNode
            key={node.id}
            isDragging={draggingVoiceNodeId === node.id}
            isMenuOpen={openVoiceMenuNodeId === node.id}
            isPlaying={playingVoiceNodeId === node.id}
            node={node}
            playbackMs={voicePlaybackMsByNodeId[node.id] ?? 0}
            onAudioEnded={() => handleAudioEnded(node.id)}
            onAudioPaused={() => handleAudioPaused(node.id)}
            onAudioPlaying={() => handleAudioPlaying(node.id)}
            onAudioRef={(element) => registerAudioElement(node.id, element)}
            onAudioTimeUpdate={(playbackMs) =>
              handleAudioTimeUpdate(node.id, playbackMs)
            }
            onMenuAction={(action) =>
              handleVoiceNodeMenuAction(node.id, action)
            }
            onPointerCancel={handleVoicePointerUp}
            onPointerDown={(event) => handleVoicePointerDown(event, node)}
            onPointerMove={handleVoicePointerMove}
            onPointerUp={handleVoicePointerUp}
            onToggleMenu={() =>
              setOpenVoiceMenuNodeId((current) =>
                current === node.id ? null : node.id,
              )
            }
            onTogglePlayback={() => toggleVoicePlayback(node.id)}
          />
        ))}
      </div>

      <CanvasDropOverlay isVisible={isFileDragging} />

      <CanvasGridControls
        backgroundColor={backgroundColor}
        gridColor={gridColor}
        gridSize={gridSize}
        gridSizePercent={gridSizePercent}
        isOpen={showGridControls}
        showGrid={showGrid}
        onBackgroundColorChange={setBackgroundColor}
        onGridColorChange={setGridColor}
        onGridSizeChange={setGridSize}
        onToggleOpen={() => setShowGridControls((c) => !c)}
        onToggleShowGrid={() => setShowGrid((c) => !c)}
        onReset={handleResetGrid}
      />

      <CanvasFitToViewButton onClick={fitContentToView} />

      <CanvasZoomControls
        canZoomIn={viewport.zoom < MAX_ZOOM}
        canZoomOut={viewport.zoom > MIN_ZOOM}
        zoomPercent={zoomPercent}
        onResetZoom={resetZoom}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
      />

      <CanvasContentsPanel
        isOpen={showContentsPanel}
        items={canvasContentsItems}
        onFocusItem={focusCanvasItem}
        onToggleOpen={() => setShowContentsPanel((current) => !current)}
      />

      {selectedImageIds.length >= 2 && (
        <ImageSelectionArrangeBar
          count={selectedImageIds.length}
          onArrange={applyImageLayout}
          onClearSelection={() => setSelectedImageIds([])}
        />
      )}

      {activeWebNode && (
        <WebsitePreviewModal
          title={activeWebNode.title}
          url={activeWebNode.url}
          onClose={() => setActiveWebNodeId(null)}
        />
      )}

      <CanvasLoadingOverlay isVisible={!isClientReady || isCanvasLoading} />
    </div>
  );
}
