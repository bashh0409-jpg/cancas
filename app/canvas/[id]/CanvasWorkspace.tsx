"use client";

import type {
  CSSProperties,
  DragEvent as ReactDragEvent,
  PointerEvent as ReactPointerEvent,
  WheelEvent,
} from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CanvasContentsItem } from "@/app/components/canvas/CanvasContentsPanel";
import { CanvasDropOverlay } from "@/app/components/canvas/CanvasDropOverlay";
import { CanvasImageNode } from "@/app/components/canvas/CanvasImageNode";
import { CanvasLeftSidebar } from "@/app/components/canvas/CanvasLeftSidebar";
import { CanvasLoadingOverlay } from "@/app/components/canvas/CanvasLoadingOverlay";
import { CanvasMarqueeSelection } from "@/app/components/canvas/CanvasMarqueeSelection";
import { Sidebar } from "@/app/components/canvas/Sidebar";
import {
  CanvasTextNode,
  type CanvasTextNodeData,
} from "@/app/components/canvas/CanvasTextNode";
import {
  CanvasAiChatNode,
  type CanvasAiChatNodeData,
} from "@/app/components/canvas/CanvasAiChatNode";
import { CanvasVoiceNode } from "@/app/components/canvas/CanvasVoiceNode";
import { CanvasWebNode } from "@/app/components/canvas/CanvasWebNode";
import { ImageSelectionArrangeBar } from "@/app/components/canvas/ImageSelectionArrangeBar";
import type { VoiceNoteMenuAction } from "@/app/components/canvas/VoiceNoteOptionsMenu";
import type { ResizeCorner } from "@/app/components/canvas/NodeResizeHandles";
import { useLayersStore, type CanvasLayer } from "@/lib/canvas/layersStore";
import { useCanvasPreferencesStore } from "@/lib/canvas/canvasPreferencesStore";
import { useViewControlsStore } from "@/lib/canvas/viewControlsStore";
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
import { CANVAS_TEXT_TOOL_EVENT } from "@/lib/canvas/textToolEvents";
import { CANVAS_AI_CHAT_TOOL_EVENT } from "@/lib/canvas/aiChatToolEvents";
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
import type { LibraryAsset } from "@/lib/canvas/assetLibrary";
import {
  blobToDataUrl,
  formatVoiceNoteTitle,
} from "@/lib/canvas/voiceNoteUtils";
import { parseCanvasContent, type CanvasContent } from "@/types/canvas";
import { SIDEBAR_PANEL_EVENT } from "@/lib/canvas/sidebarEvents";
import {
  CanvasTranscriptionNode,
  type CanvasTranscriptionNodeData,
} from "@/app/components/canvas/CanvasTranscriptionNode";
import { ElbowConnector } from "@/app/components/canvas/ElbowConnector";
import { CanvasContextMenu } from "@/app/components/canvas/CanvasContextMenu";
import { TranscriptionContextMenu } from "@/app/components/canvas/TranscriptionContextMenu";
import {
  ImageContextMenu,
  type ImageMenuAction,
} from "@/app/components/canvas/ImageContextMenu";
import { UnsplashSearchModal } from "@/app/components/canvas/UnsplashSearchModal";
import { showToast } from "@/app/components/home/Toast";

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
  visible?: boolean;
  locked?: boolean;
};

type ImageSyncStats = {
  synced: number;
  total: number;
  failed: number;
};

type CanvasWorkspaceProps = {
  canvasId: string;
  userId: string;
  canvasName: string;
  canvases: { id: string; name: string; slug: string }[];
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
  visible?: boolean;
  locked?: boolean;
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
  visible?: boolean;
  locked?: boolean;
};

type VoiceDragState = {
  nodeId: string;
  offset: Point;
};

type TextDragState = {
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
    visible: node.visible,
    locked: node.locked,
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
  canvases,
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
  const textNodesRef = useRef<CanvasTextNodeData[]>(initialContent.textNodes);
  const aiChatNodesRef = useRef<CanvasAiChatNodeData[]>(
    initialContent.aiChatNodes,
  );
  const transcriptionNodesRef = useRef<CanvasTranscriptionNodeData[]>(
    initialContent.transcriptionNodes ?? [],
  );
  const imageDragRef = useRef<ImageDragState | null>(null);
  const imageResizeRef = useRef<NodeResizeState | null>(null);
  const webDragRef = useRef<WebDragState | null>(null);
  const voiceDragRef = useRef<VoiceDragState | null>(null);
  const textDragRef = useRef<TextDragState | null>(null);
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
  const [gridLineType, setGridLineType] = useState(initialContent.gridLineType);
  const wireType = useCanvasPreferencesStore((state) => state.wireType);
  const handleResetGrid = () => {
    setBackgroundColor(initialContent.backgroundColor);
    setGridColor(initialContent.gridColor);
    setGridSize(initialContent.gridSize);
    setShowGrid(initialContent.showGrid);
    setGridLineType(initialContent.gridLineType);
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
  const [draggingTextNodeId, setDraggingTextNodeId] = useState<string | null>(
    null,
  );
  const [selectedTextNodeId, setSelectedTextNodeId] = useState<string | null>(
    null,
  );
  const [editingTextNodeId, setEditingTextNodeId] = useState<string | null>(
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
  const [textNodes, setTextNodes] = useState<CanvasTextNodeData[]>(
    initialContent.textNodes,
  );
  const [aiChatNodes, setAiChatNodes] = useState<CanvasAiChatNodeData[]>(
    initialContent.aiChatNodes,
  );
  const [transcriptionNodes, setTranscriptionNodes] = useState<
    CanvasTranscriptionNodeData[]
  >(initialContent.transcriptionNodes ?? []);
  const disconnectTranscriptionInput = useCallback(
    (transcriptionNodeId: string) => {
      setTranscriptionNodes((current) =>
        current.map((entry) =>
          entry.id === transcriptionNodeId
            ? { ...entry, sourceNodeId: undefined }
            : entry,
        ),
      );
    },
    [],
  );
  const disconnectVoiceOutputs = useCallback((voiceNodeId: string) => {
    setTranscriptionNodes((current) =>
      current.map((entry) =>
        entry.sourceNodeId === voiceNodeId
          ? { ...entry, sourceNodeId: undefined }
          : entry,
      ),
    );
  }, []);
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
  const [isSavingCanvas, setIsSavingCanvas] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [transcriptionContextMenu, setTranscriptionContextMenu] = useState<{
    nodeId: string;
    x: number;
    y: number;
  } | null>(null);
  const [imageContextMenu, setImageContextMenu] = useState<{
    nodeId: string;
    x: number;
    y: number;
  } | null>(null);
  const [processingRemoveBgNodeIds, setProcessingRemoveBgNodeIds] = useState<
    Set<string>
  >(new Set());
  const [showUnsplash, setShowUnsplash] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
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
  const syncStats = useMemo(
    () => ({
      synced: cloudSyncedCount,
      total: totalImageCount,
      failed: 0,
    }),
    [cloudSyncedCount, totalImageCount],
  );
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
        ...textNodes.map((node) => ({
          id: node.id,
          kind: "text" as const,
          label: node.text.trim() || "Sticky note",
        })),
        ...aiChatNodes.map((node) => ({
          id: node.id,
          kind: "text" as const,
          label: "AI Chat",
        })),
      ].sort((a, b) => {
        const getZIndex = (item: CanvasContentsItem) => {
          if (item.kind === "image") {
            return imageNodes.find((node) => node.id === item.id)?.zIndex ?? 0;
          }

          if (item.kind === "website") {
            return webNodes.find((node) => node.id === item.id)?.zIndex ?? 0;
          }

          if (item.kind === "voice") {
            return voiceNodes.find((node) => node.id === item.id)?.zIndex ?? 0;
          }

          return textNodes.find((node) => node.id === item.id)?.zIndex ?? 0;
        };

        return getZIndex(b) - getZIndex(a);
      }),
    [imageNodes, textNodes, voiceNodes, webNodes],
  );
  const canvasLayers = useMemo<CanvasLayer[]>(
    () =>
      [
        ...imageNodes.map((node) => ({
          id: node.id,
          name: node.fileName,
          type: "image" as const,
          visible: node.visible ?? true,
          locked: node.locked ?? false,
          zIndex: node.zIndex,
        })),
        ...webNodes.map((node) => ({
          id: node.id,
          name: node.title,
          type: "web" as const,
          visible: node.visible ?? true,
          locked: node.locked ?? false,
          zIndex: node.zIndex,
        })),
        ...voiceNodes.map((node) => ({
          id: node.id,
          name: node.title,
          type: "voice" as const,
          visible: node.visible ?? true,
          locked: node.locked ?? false,
          zIndex: node.zIndex,
        })),
        ...textNodes.map((node) => ({
          id: node.id,
          name: node.text.trim() || "Sticky note",
          type: "text" as const,
          visible: node.visible ?? true,
          locked: node.locked ?? false,
          zIndex: node.zIndex,
        })),
        ...aiChatNodes.map((node) => ({
          id: node.id,
          name: node.name || "Untitled chat",
          type: "text" as const,
          visible: node.visible ?? true,
          locked: node.locked ?? false,
          zIndex: node.zIndex,
        })),
      ].sort((a, b) => a.zIndex - b.zIndex),
    [imageNodes, textNodes, voiceNodes, webNodes, aiChatNodes],
  );

  useEffect(() => {
    onImageSyncStatsChange?.({
      synced: cloudSyncedCount,
      total: totalImageCount,
      failed: 0,
    });
  }, [cloudSyncedCount, totalImageCount, onImageSyncStatsChange]);

  const updateLayers = useLayersStore((state) => state.updateLayers);
  const registerLayerActions = useLayersStore(
    (state) => state.registerLayerActions,
  );
  const clearLayerActions = useLayersStore((state) => state.clearLayerActions);
  const syncSelectedLayer = useLayersStore((state) => state.syncSelectedLayer);
  const registerViewControls = useViewControlsStore(
    (state) => state.registerViewControls,
  );
  const clearViewControls = useViewControlsStore(
    (state) => state.clearViewControls,
  );
  const updateViewControlState = useViewControlsStore(
    (state) => state.updateViewControlState,
  );
  useEffect(() => {
    updateLayers(canvasLayers);
  }, [canvasLayers, updateLayers]);

  useEffect(() => {
    const localDraft = readLocalCanvasDraft(canvasId, serverUpdatedAt);

    if (localDraft?.content) {
      const content = localDraft.content;

      setViewport(content.viewport);
      setImageNodes(content.imageNodes);
      setWebNodes(content.webNodes);
      setVoiceNodes(content.voiceNodes);
      setTextNodes(content.textNodes);
      setAiChatNodes(content.aiChatNodes);
      imageNodesRef.current = content.imageNodes;
      webNodesRef.current = content.webNodes;
      voiceNodesRef.current = content.voiceNodes;
      textNodesRef.current = content.textNodes;
      aiChatNodesRef.current = content.aiChatNodes;
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

      setShowGrid(content.showGrid);
      setBackgroundColor(content.backgroundColor);
      setGridColor(content.gridColor);
      setGridSize(content.gridSize);
      setGridLineType(content.gridLineType);
      setImageNodes(mergedImageNodes);
      setWebNodes(content.webNodes);
      setVoiceNodes(content.voiceNodes);
      setTextNodes(content.textNodes);
      setAiChatNodes(content.aiChatNodes);
      imageNodesRef.current = mergedImageNodes;
      webNodesRef.current = content.webNodes;
      voiceNodesRef.current = content.voiceNodes;
      textNodesRef.current = content.textNodes;
      aiChatNodesRef.current = content.aiChatNodes;
      setSelectedImageIds([]);
      setSelectedTextNodeId(null);
      setEditingTextNodeId(null);
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
    syncSelectedLayer(
      selectedImageIds.length === 1
        ? selectedImageIds[0]
        : (selectedTextNodeId ?? activeWebNodeId),
    );
  }, [
    activeWebNodeId,
    selectedImageIds,
    selectedTextNodeId,
    syncSelectedLayer,
  ]);

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
    textNodesRef.current = textNodes;
  }, [textNodes]);

  useEffect(() => {
    aiChatNodesRef.current = aiChatNodes;
  }, [aiChatNodes]);

  useEffect(() => {
    transcriptionNodesRef.current = transcriptionNodes;
  }, [transcriptionNodes]);

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
    function handleTextToolActivated() {
      const rect = canvasRef.current?.getBoundingClientRect();

      if (!rect || !isClientReady) {
        return;
      }

      const vp = viewportRef.current;
      const center = {
        x: (rect.width / 2 - vp.x) / vp.zoom,
        y: (rect.height / 2 - vp.y) / vp.zoom,
      };
      const topZIndex = Math.max(
        0,
        ...imageNodesRef.current.map((node) => node.zIndex),
        ...webNodesRef.current.map((node) => node.zIndex),
        ...voiceNodesRef.current.map((node) => node.zIndex),
        ...textNodesRef.current.map((node) => node.zIndex),
      );
      const id = crypto.randomUUID();
      const note: CanvasTextNodeData = {
        id,
        text: "",
        position: {
          x: center.x - 90,
          y: center.y - 60,
        },
        size: {
          width: 180,
          height: 120,
        },
        zIndex: topZIndex + 1,
        style: {
          backgroundColor: "#f8e36b",
          color: "#171717",
          fontFamily: "var(--font-helvetica-neue), Arial, sans-serif",
          fontSize: 16,
        },
      };

      setTextNodes((current) => [...current, note]);
      setSelectedImageIds([]);
      setSelectedTextNodeId(id);
      setEditingTextNodeId(id);
      setActiveWebNodeId(null);
      saveDelayMsRef.current = 0;
    }

    window.addEventListener(CANVAS_TEXT_TOOL_EVENT, handleTextToolActivated);

    return () => {
      window.removeEventListener(
        CANVAS_TEXT_TOOL_EVENT,
        handleTextToolActivated,
      );
    };
  }, [isClientReady]);

  const viewportRef = useRef(viewport);
  viewportRef.current = viewport;

  useEffect(() => {
    function handleAiChatToolActivated() {
      const rect = canvasRef.current?.getBoundingClientRect();

      if (!rect || !isClientReady) {
        return;
      }

      const vp = viewportRef.current;
      const center = {
        x: (rect.width / 2 - vp.x) / vp.zoom,
        y: (rect.height / 2 - vp.y) / vp.zoom,
      };
      const topZIndex = Math.max(
        0,
        ...imageNodesRef.current.map((node) => node.zIndex),
        ...webNodesRef.current.map((node) => node.zIndex),
        ...voiceNodesRef.current.map((node) => node.zIndex),
        ...textNodesRef.current.map((node) => node.zIndex),
        ...aiChatNodesRef.current.map((node) => node.zIndex),
      );
      const id = crypto.randomUUID();
      const chatNode: CanvasAiChatNodeData = {
        id,
        name: "Untitled",
        position: {
          x: center.x - 190,
          y: center.y - 160,
        },
        size: {
          width: 380,
          height: 320,
        },
        zIndex: topZIndex + 1,
        style: {
          backgroundColor: "#ffffff",
          color: "#171717",
          fontFamily: "var(--font-helvetica-neue), Arial, sans-serif",
          fontSize: 13,
        },
        messages: [],
      };

      setAiChatNodes((current) => [...current, chatNode]);
      setSelectedImageIds([]);
      setSelectedTextNodeId(null);
      setEditingTextNodeId(null);
      setActiveWebNodeId(null);
      saveDelayMsRef.current = 0;
    }

    window.addEventListener(
      CANVAS_AI_CHAT_TOOL_EVENT,
      handleAiChatToolActivated,
    );

    return () => {
      window.removeEventListener(
        CANVAS_AI_CHAT_TOOL_EVENT,
        handleAiChatToolActivated,
      );
    };
  }, [isClientReady]);

  useEffect(() => {
    function handleFileImport(event: Event) {
      const customEvent = event as CustomEvent<{ files: File[] }>;
      const files = Array.from(customEvent.detail?.files ?? []).filter((file) =>
        file.type.startsWith("image/"),
      );

      if (!files.length || !isClientReady) {
        return;
      }

      const rect = canvasRef.current?.getBoundingClientRect();

      if (!rect) {
        return;
      }

      const vp = viewportRef.current;
      const dropPosition = {
        x: (rect.width / 2 - vp.x) / vp.zoom,
        y: (rect.height / 2 - vp.y) / vp.zoom,
      };

      const topZIndex = Math.max(
        0,
        ...imageNodesRef.current.map((node) => node.zIndex),
        ...webNodesRef.current.map((node) => node.zIndex),
        ...voiceNodesRef.current.map((node) => node.zIndex),
        ...textNodesRef.current.map((node) => node.zIndex),
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

    window.addEventListener("canvasai:file-import", handleFileImport);

    return () => {
      window.removeEventListener("canvasai:file-import", handleFileImport);
    };
  }, [isClientReady]);

  // Handle library imports — assets come with public URLs already stored in Supabase
  useEffect(() => {
    function handleLibraryImport(event: Event) {
      const customEvent = event as CustomEvent<{
        libraryAssets: LibraryAsset[];
      }>;
      const assets = customEvent.detail?.libraryAssets ?? [];

      if (!assets.length || !isClientReady) {
        return;
      }

      const rect = canvasRef.current?.getBoundingClientRect();

      if (!rect) {
        return;
      }

      const vp = viewportRef.current;
      const dropPosition = {
        x: (rect.width / 2 - vp.x) / vp.zoom,
        y: (rect.height / 2 - vp.y) / vp.zoom,
      };

      const topZIndex = Math.max(
        0,
        ...imageNodesRef.current.map((node) => node.zIndex),
        ...webNodesRef.current.map((node) => node.zIndex),
        ...voiceNodesRef.current.map((node) => node.zIndex),
        ...textNodesRef.current.map((node) => node.zIndex),
      );

      const addedIds: string[] = [];

      for (let index = 0; index < assets.length; index += 1) {
        const asset = assets[index];
        const nodeId = crypto.randomUUID();
        const placeholderSize = fitImageSize(320, 240);

        setImageNodes((current) => [
          ...current,
          {
            id: nodeId,
            fileName: asset.file_name,
            url: asset.public_url,
            storagePath: asset.storage_path,
            position: {
              x: dropPosition.x + index * 20,
              y: dropPosition.y + index * 20,
            },
            size: placeholderSize,
            zIndex: topZIndex + index + 1,
          },
        ]);

        addedIds.push(nodeId);

        // Load natural size asynchronously
        const img = new Image();
        img.onload = () => {
          const fittedSize = fitImageSize(img.naturalWidth, img.naturalHeight);
          setImageNodes((current) =>
            current.map((node) =>
              node.id === nodeId ? { ...node, size: fittedSize } : node,
            ),
          );
        };
        img.src = asset.public_url;
      }

      if (addedIds.length >= 2) {
        setSelectedImageIds(addedIds);
      }

      saveDelayMsRef.current = 0;
    }

    window.addEventListener("canvasai:library-import", handleLibraryImport);

    return () => {
      window.removeEventListener(
        "canvasai:library-import",
        handleLibraryImport,
      );
    };
  }, [isClientReady]);

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
      const vp = viewportRef.current;
      const center = {
        x: (rect.width / 2 - vp.x) / vp.zoom,
        y: (rect.height / 2 - vp.y) / vp.zoom,
      };
      const topZIndex = Math.max(
        0,
        ...imageNodesRef.current.map((node) => node.zIndex),
        ...webNodesRef.current.map((node) => node.zIndex),
        ...voiceNodesRef.current.map((node) => node.zIndex),
        ...textNodesRef.current.map((node) => node.zIndex),
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
  }, [isClientReady, pendingVoiceRecording]);
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
          (getImageNodeSrc(node) === null || !(node.visible ?? true)),
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
      textNodes,
      aiChatNodes,
      transcriptionNodes,
      showGrid,
      backgroundColor,
      gridColor,
      gridSize,
      gridLineType,
    };
  }, [
    aiChatNodes,
    backgroundColor,
    gridColor,
    gridLineType,
    gridSize,
    imageNodes,
    showGrid,
    textNodes,
    transcriptionNodes,
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
    } finally {
      if (!saveTimerRef.current) {
        setIsSavingCanvas(false);
      }
    }
  }, [canvasId, canvasName, isClientReady]);

  const renameCanvas = useCallback(
    async (name: string) => {
      const trimmedName = name.trim() || "Untitled";
      onRemoteNameChange?.(trimmedName);

      try {
        const response = await fetch(`/api/canvases/${canvasId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: trimmedName }),
        });

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as { slug?: string };

        if (data.slug) {
          const currentPath = window.location.pathname;
          const currentSlug = currentPath.split("/").pop();

          if (currentSlug && data.slug !== currentSlug) {
            window.location.replace(`/canvas/${data.slug}`);
          }
        }
      } catch {
        // Keep the optimistic local title; the next save can retry.
      }
    },
    [canvasId, onRemoteNameChange],
  );

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

    setIsSavingCanvas(true);
    saveTimerRef.current = setTimeout(() => {
      saveTimerRef.current = null;
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
        setSelectedTextNodeId(null);
        setEditingTextNodeId(null);
        setMarquee(null);
        return;
      }

      const primaryModifier = event.metaKey || event.ctrlKey;

      // S → open Search panel
      if (!primaryModifier && (event.key === "s" || event.key === "S")) {
        event.preventDefault();
        window.dispatchEvent(
          new CustomEvent(SIDEBAR_PANEL_EVENT, { detail: "search" }),
        );
        return;
      }

      // G → open Canvas Settings (grid/tools)
      if (!primaryModifier && (event.key === "g" || event.key === "G")) {
        event.preventDefault();
        window.dispatchEvent(
          new CustomEvent(SIDEBAR_PANEL_EVENT, { detail: "tools" }),
        );
        return;
      }

      // L → open Layers panel
      if (!primaryModifier && (event.key === "l" || event.key === "L")) {
        event.preventDefault();
        window.dispatchEvent(
          new CustomEvent(SIDEBAR_PANEL_EVENT, { detail: "layers" }),
        );
        return;
      }

      // Z → reset zoom to 100%
      if (!primaryModifier && (event.key === "z" || event.key === "Z")) {
        event.preventDefault();
        resetZoom();
        return;
      }

      // F → fit to screen
      if (!primaryModifier && (event.key === "f" || event.key === "F")) {
        event.preventDefault();
        fitContentToView();
        return;
      }

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
        let handled = false;

        // Delete selected web nodes
        if (activeWebNodeId) {
          const webNode = webNodesRef.current.find(
            (node) =>
              node.id === activeWebNodeId &&
              (node.visible ?? true) &&
              !(node.locked ?? false),
          );
          if (webNode) {
            event.preventDefault();
            setWebNodes((current) =>
              current.filter((n) => n.id !== activeWebNodeId),
            );
            setActiveWebNodeId(null);
            saveDelayMsRef.current = 0;
            handled = true;
          }
        }

        // Delete selected images
        if (!handled) {
          const selectedIds = imageNodesRef.current
            .filter(
              (node) =>
                selectedImageIdSet.has(node.id) &&
                (node.visible ?? true) &&
                !(node.locked ?? false),
            )
            .map((node) => node.id);

          if (selectedIds.length > 0) {
            event.preventDefault();
            removeImageNodes(selectedIds);
            handled = true;
          }
        }

        // Delete selected text / AI chat / voice nodes
        if (!handled && selectedTextNodeId) {
          const selectedTextNode = textNodesRef.current.find(
            (node) =>
              node.id === selectedTextNodeId &&
              (node.visible ?? true) &&
              !(node.locked ?? false),
          );

          if (selectedTextNode) {
            event.preventDefault();
            setTextNodes((current) =>
              current.filter((node) => node.id !== selectedTextNodeId),
            );
            setSelectedTextNodeId(null);
            setEditingTextNodeId(null);
            saveDelayMsRef.current = 0;
          } else {
            const selectedAiChatNode = aiChatNodesRef.current.find(
              (node) =>
                node.id === selectedTextNodeId &&
                (node.visible ?? true) &&
                !(node.locked ?? false),
            );

            if (selectedAiChatNode) {
              event.preventDefault();
              setAiChatNodes((current) =>
                current.filter((node) => node.id !== selectedTextNodeId),
              );
              setSelectedTextNodeId(null);
              saveDelayMsRef.current = 0;
            }
          }
        }

        return;
      }

      const selectAll = event.key === "a" && (event.metaKey || event.ctrlKey);

      if (selectAll) {
        event.preventDefault();
        setSelectedImageIds(
          imageNodesRef.current
            .filter((node) => (node.visible ?? true) && !(node.locked ?? false))
            .map((node) => node.id),
        );
        return;
      }

      const isDuplicateKey =
        event.key === "d" && (event.metaKey || event.ctrlKey);

      if (isDuplicateKey) {
        event.preventDefault();
        event.stopPropagation();

        const selectedNodes = imageNodesRef.current.filter(
          (node) =>
            selectedImageIdSet.has(node.id) &&
            (node.visible ?? true) &&
            !(node.locked ?? false),
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
    selectedTextNodeId,
    undoImageDelete,
    setImageNodes,
    activeWebNodeId,
    resetZoom,
    fitContentToView,
  ]);

  useEffect(() => {
    function preventBrowserZoom(event: globalThis.WheelEvent) {
      // Prevent browser zoom via Ctrl/Cmd + scroll
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
      }
    }

    // Use capture phase to intercept before the browser's default zoom
    document.addEventListener("wheel", preventBrowserZoom, {
      passive: false,
      capture: true,
    });

    return () => {
      document.removeEventListener("wheel", preventBrowserZoom, {
        capture: true,
      });
    };
  }, []);

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

    if (gridLineType === "dotted") {
      // Dotted grid pattern using radial-gradient
      return {
        backgroundColor,
        backgroundImage: `radial-gradient(circle, ${gridColorValue} 1px, transparent 1px)`,
        backgroundPosition: `${viewport.x}px ${viewport.y}px`,
        backgroundSize: `${scaledSize}px ${scaledSize}px`,
      };
    }

    // Solid grid pattern (default)
    return {
      backgroundColor,
      backgroundImage: `linear-gradient(${gridColorValue} 1px, transparent 1px), linear-gradient(90deg, ${gridColorValue} 1px, transparent 1px)`,
      backgroundPosition: `${viewport.x}px ${viewport.y}px`,
      backgroundSize: `${scaledSize}px ${scaledSize}px`,
    };
  }, [backgroundColor, gridColor, gridLineType, gridSize, showGrid, viewport]);

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

  const focusCanvasBounds = useCallback(
    (bounds: { position: Point; size: { width: number; height: number } }) => {
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
    },
    [],
  );

  function focusCanvasItem(item: CanvasContentsItem) {
    const node =
      item.kind === "image"
        ? imageNodesRef.current.find((entry) => entry.id === item.id)
        : item.kind === "website"
          ? webNodesRef.current.find((entry) => entry.id === item.id)
          : item.kind === "voice"
            ? voiceNodesRef.current.find((entry) => entry.id === item.id)
            : (textNodesRef.current.find((entry) => entry.id === item.id) ??
              aiChatNodesRef.current.find((entry) => entry.id === item.id));

    if (!node) {
      return;
    }

    focusCanvasBounds({
      position: node.position,
      size: node.size,
    });

    setSelectedImageIds(item.kind === "image" ? [item.id] : []);
    setSelectedTextNodeId(item.kind === "text" ? item.id : null);
    setActiveWebNodeId(null);
    setShowContentsPanel(false);
  }

  const selectCanvasLayer = useCallback(
    (id: string | null) => {
      if (!id) {
        setSelectedImageIds([]);
        setActiveWebNodeId(null);
        return;
      }

      const imageNode = imageNodesRef.current.find((node) => node.id === id);

      if (imageNode) {
        focusCanvasBounds({
          position: imageNode.position,
          size: imageNode.size,
        });
        setSelectedImageIds([id]);
        setActiveWebNodeId(null);
        return;
      }

      const webNode = webNodesRef.current.find((node) => node.id === id);

      if (webNode) {
        focusCanvasBounds({
          position: webNode.position,
          size: webNode.size,
        });
        setSelectedImageIds([]);
        setActiveWebNodeId(id);
        return;
      }

      const voiceNode = voiceNodesRef.current.find((node) => node.id === id);

      if (voiceNode) {
        focusCanvasBounds({
          position: voiceNode.position,
          size: voiceNode.size,
        });
        setSelectedImageIds([]);
        setSelectedTextNodeId(null);
        setActiveWebNodeId(null);
        return;
      }

      const textNode = textNodesRef.current.find((node) => node.id === id);

      if (textNode) {
        focusCanvasBounds({
          position: textNode.position,
          size: textNode.size,
        });
        setSelectedImageIds([]);
        setSelectedTextNodeId(id);
        setActiveWebNodeId(null);
        return;
      }

      const aiChatNode = aiChatNodesRef.current.find((node) => node.id === id);

      if (aiChatNode) {
        focusCanvasBounds({
          position: aiChatNode.position,
          size: aiChatNode.size,
        });
        setSelectedImageIds([]);
        setSelectedTextNodeId(id);
        setActiveWebNodeId(null);
      }
    },
    [focusCanvasBounds],
  );

  const toggleCanvasLayerVisibility = useCallback((id: string) => {
    setImageNodes((current) =>
      current.map((node) =>
        node.id === id ? { ...node, visible: !(node.visible ?? true) } : node,
      ),
    );
    setWebNodes((current) =>
      current.map((node) =>
        node.id === id ? { ...node, visible: !(node.visible ?? true) } : node,
      ),
    );
    setVoiceNodes((current) =>
      current.map((node) =>
        node.id === id ? { ...node, visible: !(node.visible ?? true) } : node,
      ),
    );
    setTextNodes((current) =>
      current.map((node) =>
        node.id === id ? { ...node, visible: !(node.visible ?? true) } : node,
      ),
    );
    setAiChatNodes((current) =>
      current.map((node) =>
        node.id === id ? { ...node, visible: !(node.visible ?? true) } : node,
      ),
    );
    setSelectedImageIds((current) => current.filter((nodeId) => nodeId !== id));
    setSelectedTextNodeId((current) => (current === id ? null : current));
    setActiveWebNodeId((current) => (current === id ? null : current));
    saveDelayMsRef.current = 0;
  }, []);

  const toggleCanvasLayerLocked = useCallback((id: string) => {
    setImageNodes((current) =>
      current.map((node) =>
        node.id === id ? { ...node, locked: !(node.locked ?? false) } : node,
      ),
    );
    setWebNodes((current) =>
      current.map((node) =>
        node.id === id ? { ...node, locked: !(node.locked ?? false) } : node,
      ),
    );
    setVoiceNodes((current) =>
      current.map((node) =>
        node.id === id ? { ...node, locked: !(node.locked ?? false) } : node,
      ),
    );
    setTextNodes((current) =>
      current.map((node) =>
        node.id === id ? { ...node, locked: !(node.locked ?? false) } : node,
      ),
    );
    setAiChatNodes((current) =>
      current.map((node) =>
        node.id === id ? { ...node, locked: !(node.locked ?? false) } : node,
      ),
    );
    saveDelayMsRef.current = 0;
  }, []);

  const renameCanvasLayer = useCallback((id: string, name: string) => {
    const nextName = name.trim();

    if (!nextName) {
      return;
    }

    setImageNodes((current) =>
      current.map((node) =>
        node.id === id ? { ...node, fileName: nextName } : node,
      ),
    );
    setWebNodes((current) =>
      current.map((node) =>
        node.id === id ? { ...node, title: nextName } : node,
      ),
    );
    setVoiceNodes((current) =>
      current.map((node) =>
        node.id === id ? { ...node, title: nextName } : node,
      ),
    );
    setTextNodes((current) =>
      current.map((node) =>
        node.id === id ? { ...node, text: nextName } : node,
      ),
    );
    setAiChatNodes((current) =>
      current.map((node) =>
        node.id === id ? { ...node, title: nextName } : node,
      ),
    );
    saveDelayMsRef.current = 0;
  }, []);

  const deleteCanvasLayer = useCallback(
    (id: string) => {
      const imageNode = imageNodesRef.current.find((node) => node.id === id);

      if (imageNode) {
        if (imageNode.locked ?? false) {
          return;
        }

        removeImageNodes([id]);
        return;
      }

      const webNode = webNodesRef.current.find((node) => node.id === id);

      if (webNode) {
        if (webNode.locked ?? false) {
          return;
        }

        setWebNodes((current) => current.filter((node) => node.id !== id));
        setActiveWebNodeId((current) => (current === id ? null : current));
        saveDelayMsRef.current = 0;
        return;
      }

      const voiceNode = voiceNodesRef.current.find((node) => node.id === id);

      if (voiceNode) {
        if (voiceNode.locked ?? false) {
          return;
        }

        removeNodePlayback(id);
        setVoiceNodes((current) => current.filter((node) => node.id !== id));
        setOpenVoiceMenuNodeId((current) => (current === id ? null : current));
        saveDelayMsRef.current = 0;
        return;
      }

      const textNode = textNodesRef.current.find((node) => node.id === id);

      if (textNode) {
        if (textNode.locked ?? false) {
          return;
        }

        setTextNodes((current) => current.filter((node) => node.id !== id));
        setSelectedTextNodeId((current) => (current === id ? null : current));
        setEditingTextNodeId((current) => (current === id ? null : current));
        saveDelayMsRef.current = 0;
        return;
      }

      const aiChatNode = aiChatNodesRef.current.find((node) => node.id === id);

      if (aiChatNode && !(aiChatNode.locked ?? false)) {
        setAiChatNodes((current) => current.filter((node) => node.id !== id));
        setSelectedTextNodeId((current) => (current === id ? null : current));
        saveDelayMsRef.current = 0;
      }
    },
    [removeImageNodes, removeNodePlayback],
  );

  useEffect(() => {
    registerLayerActions({
      onSelectLayer: selectCanvasLayer,
      onToggleLayerVisibility: toggleCanvasLayerVisibility,
      onToggleLayerLocked: toggleCanvasLayerLocked,
      onRenameLayer: renameCanvasLayer,
      onDeleteLayer: deleteCanvasLayer,
    });

    return () => {
      clearLayerActions();
    };
  }, [
    clearLayerActions,
    deleteCanvasLayer,
    registerLayerActions,
    renameCanvasLayer,
    selectCanvasLayer,
    toggleCanvasLayerLocked,
    toggleCanvasLayerVisibility,
  ]);

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
      ...textNodesRef.current.map((node) => ({
        x: node.position.x,
        y: node.position.y,
        width: node.size.width,
        height: node.size.height,
      })),
      ...aiChatNodesRef.current.map((node) => ({
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

  useEffect(() => {
    registerViewControls({
      onFitToScreen: fitContentToView,
      onZoomIn: zoomIn,
      onZoomOut: zoomOut,
      onResetZoom: resetZoom,
    });

    return () => {
      clearViewControls();
    };
  }, [clearViewControls, registerViewControls]);

  useEffect(() => {
    updateViewControlState({
      canZoomIn: viewport.zoom < MAX_ZOOM,
      canZoomOut: viewport.zoom > MIN_ZOOM,
      zoomPercent,
    });
  }, [updateViewControlState, viewport.zoom, zoomPercent]);

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
    const selected = imageNodes.filter(
      (node) =>
        selectedImageIdSet.has(node.id) &&
        (node.visible ?? true) &&
        !(node.locked ?? false),
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
      setSelectedTextNodeId(null);
      setEditingTextNodeId(null);
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
      .filter(
        (node) =>
          (node.visible ?? true) &&
          !(node.locked ?? false) &&
          imageIntersectsRect(node, rect),
      )
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

  function handleTextPointerDown(
    event: ReactPointerEvent<HTMLDivElement>,
    node: CanvasTextNodeData,
  ) {
    if (node.locked ?? false) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);

    const point = screenToCanvas({ x: event.clientX, y: event.clientY });
    textDragRef.current = {
      nodeId: node.id,
      offset: {
        x: point.x - node.position.x,
        y: point.y - node.position.y,
      },
    };
    setDraggingTextNodeId(node.id);
    setSelectedImageIds([]);
    setSelectedTextNodeId(node.id);
    setActiveWebNodeId(null);

    setTextNodes((current) => {
      const topZIndex = Math.max(
        0,
        ...imageNodesRef.current.map((entry) => entry.zIndex),
        ...webNodesRef.current.map((entry) => entry.zIndex),
        ...voiceNodesRef.current.map((entry) => entry.zIndex),
        ...current.map((entry) => entry.zIndex),
      );

      return current.map((entry) =>
        entry.id === node.id ? { ...entry, zIndex: topZIndex + 1 } : entry,
      );
    });
  }

  function handleTextPointerMove(event: ReactPointerEvent<HTMLElement>) {
    const dragState = textDragRef.current;

    if (!dragState) {
      return;
    }

    const point = screenToCanvas({ x: event.clientX, y: event.clientY });

    const updatePosition = <T extends { id: string; position: Point }>(
      current: T[],
    ) =>
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
      );

    setTextNodes(updatePosition);
    setAiChatNodes(updatePosition);
    setTranscriptionNodes(updatePosition);
  }

  function handleTextPointerUp(event: ReactPointerEvent<HTMLElement>) {
    textDragRef.current = null;
    setDraggingTextNodeId(null);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function handleImagePointerDown(
    event: ReactPointerEvent<HTMLDivElement>,
    node: ImageCanvasNode,
  ) {
    if (imageResizeRef.current || (node.locked ?? false)) {
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

    setSelectedTextNodeId(null);
    setEditingTextNodeId(null);
    setActiveWebNodeId(null);
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
    if (webResizeRef.current || (node.locked ?? false)) {
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
    setSelectedImageIds([]);
    setSelectedTextNodeId(null);
    setEditingTextNodeId(null);

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
    if (node.locked ?? false) {
      return;
    }

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
    if (node.locked ?? false) {
      return;
    }

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
    if (node.locked ?? false) {
      return;
    }

    // Ignore pointer down on interactive elements (buttons, etc.) so that
    // click events on controls like the play button work properly.
    const target = event.target as HTMLElement;
    if (
      target.tagName === "BUTTON" ||
      target.closest("button") ||
      target.getAttribute("role") === "button"
    ) {
      return;
    }

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
    setSelectedImageIds([]);
    setSelectedTextNodeId(null);
    setEditingTextNodeId(null);
    setActiveWebNodeId(null);

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

  function handleTranscriptionContextMenu(
    event: React.MouseEvent<HTMLDivElement>,
    node: CanvasTranscriptionNodeData,
  ) {
    event.preventDefault();
    event.stopPropagation();
    setContextMenu(null);
    setTranscriptionContextMenu({
      nodeId: node.id,
      x: event.clientX,
      y: event.clientY,
    });
  }

  function handleImageContextMenu(
    event: React.MouseEvent<HTMLDivElement>,
    node: ImageCanvasNode,
  ) {
    event.preventDefault();
    event.stopPropagation();
    setContextMenu(null);
    setImageContextMenu({
      nodeId: node.id,
      x: event.clientX,
      y: event.clientY,
    });
  }

  function handleImageMenuAction(action: ImageMenuAction) {
    if (!imageContextMenu) return;

    const nodeId = imageContextMenu.nodeId;
    const node = imageNodesRef.current.find((n) => n.id === nodeId);
    if (!node) return;

    if (action === "delete") {
      removeImageNodes([nodeId]);
    } else if (action === "duplicate") {
      const topZIndex = Math.max(
        0,
        ...imageNodesRef.current.map((n) => n.zIndex),
      );
      const duplicatedNode = {
        ...node,
        id: crypto.randomUUID(),
        position: {
          x: node.position.x + 20,
          y: node.position.y + 20,
        },
        zIndex: topZIndex + 1,
      };
      setImageNodes((current) => [...current, duplicatedNode]);
      setSelectedImageIds([duplicatedNode.id]);
    } else if (action === "download") {
      const link = document.createElement("a");
      link.href = node.url;
      link.download = node.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (action === "remove-background") {
      // Mark node as processing
      setProcessingRemoveBgNodeIds((current) => new Set(current).add(nodeId));

      void (async () => {
        try {
          const keepOriginal =
            useCanvasPreferencesStore.getState().keepOriginalImageOnRemoveBg;

          // Fetch the image blob
          const response = await fetch(node.url);
          const blob = await response.blob();

          // Create form data with the image
          const formData = new FormData();
          formData.append("image", blob, node.fileName);

          // Call the remove background API
          const bgResponse = await fetch("/api/ai/remove-background", {
            method: "POST",
            body: formData,
          });

          if (!bgResponse.ok) {
            const errorData = (await bgResponse.json().catch(() => null)) as {
              error?: string;
            } | null;
            console.error(
              "Remove background failed:",
              errorData ?? bgResponse.statusText,
            );
            showToast({
              type: "error",
              title: "Remove Background Failed",
              message:
                errorData?.error ?? "Something went wrong. Please try again.",
            });
            setProcessingRemoveBgNodeIds((current) => {
              const next = new Set(current);
              next.delete(nodeId);
              return next;
            });
            return;
          }

          // Get the processed image as a blob and create a new blob URL
          const processedBlob = await bgResponse.blob();
          const processedUrl = URL.createObjectURL(processedBlob);
          const processedFileName =
            node.fileName.replace(/\.[^.]+$/, "") + "-no-bg.png";
          let targetNodeId: string;

          if (keepOriginal) {
            // Create a new node with the processed image, keeping the original intact
            const topZIndex = Math.max(
              0,
              ...imageNodesRef.current.map((n) => n.zIndex),
            );
            targetNodeId = crypto.randomUUID();
            setImageNodes((current) => [
              ...current,
              {
                id: targetNodeId,
                fileName: processedFileName,
                url: processedUrl,
                position: {
                  x: node.position.x + node.size.width + 24,
                  y: node.position.y,
                },
                size: { ...node.size },
                zIndex: topZIndex + 1,
              },
            ]);
            setSelectedImageIds([targetNodeId]);
          } else {
            targetNodeId = nodeId;

            // Revoke the old blob URL if it was a blob
            if (node.url.startsWith("blob:")) {
              URL.revokeObjectURL(node.url);
            }

            // Replace the original node with the processed image
            setImageNodes((current) =>
              current.map((n) =>
                n.id === nodeId
                  ? {
                      ...n,
                      url: processedUrl,
                      fileName: processedFileName,
                    }
                  : n,
              ),
            );

            // If the original had a storage path, remove it since the processed image needs re-upload
            if (node.storagePath) {
              setImageNodes((current) =>
                current.map((n) =>
                  n.id === nodeId ? { ...n, storagePath: undefined } : n,
                ),
              );
            }
          }

          // Upload the processed image to Supabase storage
          const processedFile = new File([processedBlob], processedFileName, {
            type: "image/png",
          });

          pendingUploadFilesRef.current.set(targetNodeId, {
            file: processedFile,
            blobUrl: processedUrl,
          });
          pendingUploadIdsRef.current.add(targetNodeId);

          try {
            await savePendingUploadFile(canvasId, targetNodeId, processedFile);
          } catch {
            // Upload can still proceed from memory.
          }

          canvasImageUploadPool.enqueue(() =>
            syncImageToStorage(targetNodeId, processedFile, processedUrl),
          );

          saveDelayMsRef.current = 0;
        } catch (error) {
          console.error("Remove background error:", error);
          showToast({
            type: "error",
            title: "Remove Background Failed",
            message:
              error instanceof Error
                ? error.message
                : "Something went wrong. Please try again.",
          });
        } finally {
          setProcessingRemoveBgNodeIds((current) => {
            const next = new Set(current);
            next.delete(nodeId);
            return next;
          });
        }
      })();
    } else if (action === "edit-with-ai") {
      // TODO: Open AI edit window / prompt for editing instructions
      console.log("Edit with AI triggered for node:", nodeId);
    } else if (action === "upscale") {
      // TODO: Implement upscale via /api/ai/image/upscale
      console.log("Upscale triggered for node:", nodeId);
    }

    setImageContextMenu(null);
  }

  const handleUnsplashSelect = useCallback(
    async (image: {
      id: string;
      urls: { regular: string; full: string };
      width: number;
      height: number;
    }) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect || !isClientReady) return;

      const vp = viewportRef.current;
      const dropPosition = {
        x: (rect.width / 2 - vp.x) / vp.zoom,
        y: (rect.height / 2 - vp.y) / vp.zoom,
      };

      const topZIndex = Math.max(
        0,
        ...imageNodesRef.current.map((node) => node.zIndex),
        ...webNodesRef.current.map((node) => node.zIndex),
        ...voiceNodesRef.current.map((node) => node.zIndex),
        ...textNodesRef.current.map((node) => node.zIndex),
      );

      try {
        const response = await fetch(image.urls.full);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const fileName = `unsplash-${image.id}.jpg`;

        const nodeId = crypto.randomUUID();
        pendingUploadFilesRef.current.set(nodeId, {
          file: new File([blob], fileName, { type: "image/jpeg" }),
          blobUrl,
        });
        pendingUploadIdsRef.current.add(nodeId);

        setImageNodes((current) => [
          ...current,
          {
            id: nodeId,
            fileName,
            url: blobUrl,
            position: {
              x: dropPosition.x - 160,
              y: dropPosition.y - 120,
            },
            size: {
              width: Math.min(320, image.width),
              height: Math.min(240, image.height),
            },
            zIndex: topZIndex + 1,
          },
        ]);

        saveDelayMsRef.current = 0;
        setShowUnsplash(false);
      } catch (err) {
        console.error("Failed to load Unsplash image:", err);
      }
    },
    [isClientReady],
  );

  function handleDeleteVoiceNode(nodeId: string) {
    const node = voiceNodesRef.current.find((entry) => entry.id === nodeId);

    if (node?.locked) {
      return;
    }

    removeNodePlayback(nodeId);
    setVoiceNodes((current) => current.filter((node) => node.id !== nodeId));
    saveDelayMsRef.current = 0;
  }

  function handleDeleteTranscriptionNode(nodeId: string) {
    setTranscriptionNodes((current) =>
      current.filter((node) => node.id !== nodeId),
    );
    saveDelayMsRef.current = 0;
  }

  async function handleTranscriptionMenuAction(
    nodeId: string,
    action: "delete" | "ask-ai" | "summarize",
  ) {
    const node = transcriptionNodesRef.current.find(
      (entry) => entry.id === nodeId,
    );
    if (!node) {
      setTranscriptionContextMenu(null);
      return;
    }

    if (action === "delete") {
      handleDeleteTranscriptionNode(nodeId);
      setTranscriptionContextMenu(null);
      return;
    }

    const prompt =
      action === "summarize"
        ? `Summarize the following transcription in a concise paragraph:\n\n${node.text}`
        : `Answer questions about the following transcription. If the user asks for details, be helpful and concise:\n\n${node.text}`;

    const chatId = crypto.randomUUID();
    const topZIndex = Math.max(
      0,
      ...imageNodesRef.current.map((n) => n.zIndex),
      ...webNodesRef.current.map((n) => n.zIndex),
      ...voiceNodesRef.current.map((n) => n.zIndex),
      ...textNodesRef.current.map((n) => n.zIndex),
      ...aiChatNodesRef.current.map((n) => n.zIndex),
    );

    const chatNode: CanvasAiChatNodeData = {
      id: chatId,
      name:
        action === "summarize" ? "Transcription Summary" : "Transcription Q&A",
      position: {
        x: node.position.x + node.size.width + 24,
        y: node.position.y,
      },
      size: {
        width: 380,
        height: 320,
      },
      zIndex: topZIndex + 1,
      style: {
        backgroundColor: "#ffffff",
        color: "#171717",
        fontFamily: "var(--font-helvetica-neue), Arial, sans-serif",
        fontSize: 13,
      },
      messages: [
        {
          id: crypto.randomUUID(),
          role: "user",
          content: prompt,
        },
      ],
    };

    setAiChatNodes((current) => [...current, chatNode]);
    setSelectedImageIds([]);
    setSelectedTextNodeId(null);
    setEditingTextNodeId(null);
    setActiveWebNodeId(null);
    saveDelayMsRef.current = 0;
    setTranscriptionContextMenu(null);
  }

  function handleVoiceNodeMenuAction(
    nodeId: string,
    action: VoiceNoteMenuAction,
  ) {
    const voiceNode = voiceNodesRef.current.find((n) => n.id === nodeId);
    if (!voiceNode) return;

    if (action === "delete") {
      handleDeleteVoiceNode(nodeId);
      setOpenVoiceMenuNodeId(null);
      return;
    }

    if (action === "transcribe") {
      const topZIndex = Math.max(
        0,
        ...imageNodesRef.current.map((n) => n.zIndex),
        ...webNodesRef.current.map((n) => n.zIndex),
        ...voiceNodesRef.current.map((n) => n.zIndex),
        ...textNodesRef.current.map((n) => n.zIndex),
        ...aiChatNodesRef.current.map((n) => n.zIndex),
      );
      const transcriptionId = crypto.randomUUID();

      const placeholderNode: CanvasTranscriptionNodeData = {
        id: transcriptionId,
        sourceNodeId: nodeId,
        text: "Transcribing...",
        position: {
          x: voiceNode.position.x + voiceNode.size.width + 32,
          y: voiceNode.position.y - 40,
        },
        size: { width: 280, height: 120 },
        zIndex: topZIndex + 1,
        style: {
          backgroundColor: "#ffffff",
          color: "#000000",
          fontFamily: "var(--font-helvetica-neue), Arial, sans-serif",
          fontSize: 13,
        },
      };

      setTranscriptionNodes((current) => [...current, placeholderNode]);
      saveDelayMsRef.current = 0;

      void (async () => {
        try {
          const audioDataUrl = voiceNode.audioDataUrl;
          let base64Audio: string;
          let mimeType = "audio/webm";

          if (audioDataUrl.startsWith("blob:")) {
            const blobResponse = await fetch(audioDataUrl);
            const blob = await blobResponse.blob();
            mimeType = blob.type || "audio/webm";
            const arrayBuffer = await blob.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);
            const binary = Array.from(uint8Array)
              .map((b) => String.fromCharCode(b))
              .join("");
            base64Audio = btoa(binary);
          } else {
            const dataUrlMatch = audioDataUrl.match(
              /^data:(audio\/[^;]+);base64,(.+)$/,
            );
            mimeType = dataUrlMatch ? dataUrlMatch[1] : "audio/webm";
            base64Audio = dataUrlMatch ? dataUrlMatch[2] : audioDataUrl;
          }

          const response = await fetch("/api/ai/run", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              provider: "deepgram",
              task: "speech-to-text",
              prompt: "Transcribe the audio",
              options: {
                imageBase64: base64Audio,
                falEndpoint: mimeType,
                language: "en",
              },
            }),
          });

          const result = (await response.json()) as {
            text?: string;
            error?: string;
          };
          const transcribedText =
            result.text ?? result.error ?? "[Transcription failed]";

          setTranscriptionNodes((current) =>
            current.map((node) =>
              node.id === transcriptionId
                ? { ...node, text: transcribedText }
                : node,
            ),
          );
          saveDelayMsRef.current = 0;
        } catch (err) {
          console.error("Transcription error:", err);
          setTranscriptionNodes((current) =>
            current.map((node) =>
              node.id === transcriptionId
                ? {
                    ...node,
                    text: `[Transcription failed: ${
                      err instanceof Error ? err.message : "Unknown error"
                    }]`,
                  }
                : node,
            ),
          );
          saveDelayMsRef.current = 0;
        }
      })();

      setOpenVoiceMenuNodeId(null);
      return;
    }

    if (action === "ask-ai") {
      window.alert("Ask AI for voice notes is coming soon.");
      setOpenVoiceMenuNodeId(null);
      return;
    }
  }

  return (
    <div
      ref={canvasRef}
      className="absolute inset-0 overflow-hidden cursor-grab"
      onContextMenu={(event) => {
        const rightClickEnabled =
          useCanvasPreferencesStore.getState().rightClickMenu;
        if (!rightClickEnabled) return;
        event.preventDefault();
        setContextMenu({ x: event.clientX, y: event.clientY });
      }}
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

        {imageNodes
          .filter((node) => node.visible ?? true)
          .map((node) => {
            const isSelected = selectedImageIdSet.has(node.id);
            const showResizeHandles =
              isSelected &&
              selectedImageIds.length === 1 &&
              !(node.locked ?? false);
            const imageSrc = getImageNodeSrc(node);

            return (
              <CanvasImageNode
                key={node.id}
                imageSrc={imageSrc}
                isDragging={draggingImageNodeId === node.id}
                isResizing={resizingImageNodeId === node.id}
                isSelected={isSelected}
                node={node}
                processing={processingRemoveBgNodeIds.has(node.id)}
                showResizeHandles={showResizeHandles}
                onContextMenu={(event) => handleImageContextMenu(event, node)}
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

        {webNodes
          .filter((node) => node.visible ?? true)
          .map((node) => (
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

        {textNodes
          .filter((node) => node.visible ?? true)
          .map((node) => (
            <CanvasTextNode
              key={node.id}
              isDragging={draggingTextNodeId === node.id}
              isEditing={editingTextNodeId === node.id}
              isSelected={selectedTextNodeId === node.id}
              node={node}
              onBlur={() => setEditingTextNodeId(null)}
              onInput={(text) =>
                setTextNodes((current) =>
                  current.map((entry) =>
                    entry.id === node.id ? { ...entry, text } : entry,
                  ),
                )
              }
              onPointerCancel={handleTextPointerUp}
              onPointerDown={(event) => handleTextPointerDown(event, node)}
              onPointerMove={handleTextPointerMove}
              onPointerUp={handleTextPointerUp}
              onSizeChange={(size) =>
                setTextNodes((current) =>
                  current.map((entry) =>
                    entry.id === node.id ? { ...entry, size } : entry,
                  ),
                )
              }
              onStartEditing={() => {
                setSelectedTextNodeId(node.id);
                setEditingTextNodeId(node.id);
              }}
            />
          ))}

        {aiChatNodes
          .filter((node) => node.visible ?? true)
          .map((node) => (
            <CanvasAiChatNode
              key={node.id}
              isDragging={draggingTextNodeId === node.id}
              isSelected={selectedTextNodeId === node.id}
              node={node}
              onPointerCancel={handleTextPointerUp}
              onPointerDown={(event) => {
                if (node.locked ?? false) return;
                event.preventDefault();
                event.stopPropagation();
                event.currentTarget.setPointerCapture(event.pointerId);
                const point = screenToCanvas({
                  x: event.clientX,
                  y: event.clientY,
                });
                textDragRef.current = {
                  nodeId: node.id,
                  offset: {
                    x: point.x - node.position.x,
                    y: point.y - node.position.y,
                  },
                };
                setDraggingTextNodeId(node.id);
                setSelectedImageIds([]);
                setSelectedTextNodeId(node.id);
                setActiveWebNodeId(null);
                setAiChatNodes((current) => {
                  const topZIndex = Math.max(
                    0,
                    ...imageNodesRef.current.map((entry) => entry.zIndex),
                    ...webNodesRef.current.map((entry) => entry.zIndex),
                    ...voiceNodesRef.current.map((entry) => entry.zIndex),
                    ...textNodesRef.current.map((entry) => entry.zIndex),
                    ...current.map((entry) => entry.zIndex),
                  );
                  return current.map((entry) =>
                    entry.id === node.id
                      ? { ...entry, zIndex: topZIndex + 1 }
                      : entry,
                  );
                });
              }}
              onPointerMove={handleTextPointerMove}
              onPointerUp={handleTextPointerUp}
              onMessagesChange={(messages) =>
                setAiChatNodes((current) =>
                  current.map((entry) =>
                    entry.id === node.id ? { ...entry, messages } : entry,
                  ),
                )
              }
              onNameChange={(name) =>
                setAiChatNodes((current) =>
                  current.map((entry) =>
                    entry.id === node.id ? { ...entry, name } : entry,
                  ),
                )
              }
              onSizeChange={(size) =>
                setAiChatNodes((current) =>
                  current.map((entry) =>
                    entry.id === node.id ? { ...entry, size } : entry,
                  ),
                )
              }
            />
          ))}

        {transcriptionNodes
          .filter((node) => node.visible ?? true)
          .map((node) => (
            <CanvasTranscriptionNode
              key={node.id}
              isDragging={draggingTextNodeId === node.id}
              isSelected={selectedTextNodeId === node.id}
              hasInput={Boolean(node.sourceNodeId)}
              node={node}
              onContextMenu={(event) =>
                handleTranscriptionContextMenu(event, node)
              }
              onDisconnectInput={() => disconnectTranscriptionInput(node.id)}
              onPointerCancel={handleTextPointerUp}
              onPointerDown={(event) => {
                if (node.locked ?? false) return;
                event.preventDefault();
                event.stopPropagation();
                event.currentTarget.setPointerCapture(event.pointerId);
                const point = screenToCanvas({
                  x: event.clientX,
                  y: event.clientY,
                });
                textDragRef.current = {
                  nodeId: node.id,
                  offset: {
                    x: point.x - node.position.x,
                    y: point.y - node.position.y,
                  },
                };
                setDraggingTextNodeId(node.id);
                setSelectedImageIds([]);
                setSelectedTextNodeId(node.id);
                setActiveWebNodeId(null);
                setTranscriptionNodes((current) => {
                  const topZIndex = Math.max(
                    0,
                    ...imageNodesRef.current.map((entry) => entry.zIndex),
                    ...webNodesRef.current.map((entry) => entry.zIndex),
                    ...voiceNodesRef.current.map((entry) => entry.zIndex),
                    ...textNodesRef.current.map((entry) => entry.zIndex),
                    ...aiChatNodesRef.current.map((entry) => entry.zIndex),
                    ...current.map((entry) => entry.zIndex),
                  );
                  return current.map((entry) =>
                    entry.id === node.id
                      ? { ...entry, zIndex: topZIndex + 1 }
                      : entry,
                  );
                });
              }}
              onPointerMove={handleTextPointerMove}
              onPointerUp={handleTextPointerUp}
            />
          ))}

        {aiChatNodes
          .filter((node) => node.sourceNodeId && node.visible !== false)
          .map((node) => {
            const sourceTranscription = transcriptionNodesRef.current.find(
              (entry) => entry.id === node.sourceNodeId,
            );
            if (!sourceTranscription) return null;
            return (
              <ElbowConnector
                key={`connector-ai-${node.id}`}
                from={{
                  x: sourceTranscription.position.x,
                  y: sourceTranscription.position.y,
                }}
                to={{ x: node.position.x, y: node.position.y }}
                fromSize={sourceTranscription.size}
                toSize={node.size}
                wireType={wireType}
                color="rgba(255,255,255,0.2)"
                strokeWidth={1.8}
              />
            );
          })}

        {/* Elbow connectors between voice nodes and transcription nodes */}
        {transcriptionNodes
          .filter((node) => {
            const sourceVoice = voiceNodesRef.current.find(
              (vn) => vn.id === node.sourceNodeId,
            );
            return sourceVoice && (node.visible ?? true);
          })
          .map((node) => {
            const sourceVoice = voiceNodesRef.current.find(
              (vn) => vn.id === node.sourceNodeId,
            )!;
            return (
              <ElbowConnector
                key={`connector-${node.id}`}
                from={{ x: sourceVoice.position.x, y: sourceVoice.position.y }}
                to={{ x: node.position.x, y: node.position.y }}
                fromSize={sourceVoice.size}
                toSize={node.size}
                wireType={wireType}
                color="rgba(255,255,255,0.2)"
                strokeWidth={1.8}
              />
            );
          })}

        {voiceNodes
          .filter((node) => node.visible ?? true)
          .map((node) => (
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
              hasOutput={transcriptionNodes.some(
                (entry) => entry.sourceNodeId === node.id,
              )}
              onDisconnectOutputs={() => disconnectVoiceOutputs(node.id)}
            />
          ))}
      </div>

      <CanvasDropOverlay isVisible={isFileDragging} />

      {false && (
        <CanvasLeftSidebar
          activeCanvasId={canvasId}
          backgroundColor={backgroundColor}
          canZoomIn={viewport.zoom < MAX_ZOOM}
          canZoomOut={viewport.zoom > MIN_ZOOM}
          canvases={[]}
          gridColor={gridColor}
          gridSize={gridSize}
          isSavingCanvas={isSavingCanvas}
          layers={canvasContentsItems}
          saveError={saveError}
          showGrid={showGrid}
          syncStats={syncStats}
          zoomPercent={zoomPercent}
          onBackgroundColorChange={setBackgroundColor}
          onFitToView={fitContentToView}
          onFocusLayer={focusCanvasItem}
          onGridColorChange={setGridColor}
          onGridSizeChange={setGridSize}
          onResetGrid={handleResetGrid}
          onResetZoom={resetZoom}
          onToggleShowGrid={() => setShowGrid((current) => !current)}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
        />
      )}

      {isClientReady && (
        <Sidebar
          activeCanvasId={canvasId}
          canvasName={canvasName}
          canvases={canvases}
          onRename={renameCanvas}
          onSwitchCanvas={(slug) => {
            window.location.href = `/canvas/${slug}`;
          }}
          gridSettings={{
            enabled: showGrid,
            color: gridColor,
            background: backgroundColor,
            lineType: gridLineType,
            size: gridSize,
          }}
          onGridSettingsChange={(updates) => {
            if (updates.enabled !== undefined) {
              setShowGrid(updates.enabled);
            }

            if (updates.color !== undefined) {
              setGridColor(updates.color);
            }

            if (updates.background !== undefined) {
              setBackgroundColor(updates.background);
            }

            if (updates.lineType !== undefined) {
              setGridLineType(updates.lineType);
            }

            if (updates.size !== undefined) {
              setGridSize(updates.size);
            }
          }}
          onImportCloudFile={async (file: File) => {
            const rect = canvasRef.current?.getBoundingClientRect();
            if (!rect) return;
            const dropPosition = {
              x: (rect.width / 2 - viewport.x) / viewport.zoom,
              y: (rect.height / 2 - viewport.y) / viewport.zoom,
            };
            const topZIndex = imageNodesRef.current.reduce(
              (max, node) => Math.max(max, node.zIndex),
              Math.max(
                0,
                ...webNodesRef.current.map((node) => node.zIndex),
                ...voiceNodesRef.current.map((node) => node.zIndex),
              ),
            );
            addDroppedImageFile(file, 0, dropPosition, topZIndex);
          }}
        />
      )}

      {selectedImageIds.length >= 2 && (
        <ImageSelectionArrangeBar
          count={selectedImageIds.length}
          onArrange={applyImageLayout}
          onClearSelection={() => setSelectedImageIds([])}
        />
      )}

      {saveError && (
        <div className="absolute left-4 top-4 z-50 rounded-sm bg-red-600/90 px-4 py-2 text-sm text-white shadow-lg">
          {saveError}
        </div>
      )}

      {activeWebNode && (
        <WebsitePreviewModal
          title={activeWebNode.title}
          url={activeWebNode.url}
          onOpenInNewTab={() => window.open(activeWebNode.url, "_blank")}
          onClose={() => setActiveWebNodeId(null)}
        />
      )}

      <CanvasLoadingOverlay isVisible={!isClientReady || isCanvasLoading} />

      {contextMenu && (
        <CanvasContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onImportClick={() => fileInputRef.current?.click()}
          onUnsplashClick={() => setShowUnsplash(true)}
        />
      )}

      {imageContextMenu && (
        <ImageContextMenu
          x={imageContextMenu.x}
          y={imageContextMenu.y}
          onAction={handleImageMenuAction}
          onClose={() => setImageContextMenu(null)}
        />
      )}

      {transcriptionContextMenu && (
        <TranscriptionContextMenu
          x={transcriptionContextMenu.x}
          y={transcriptionContextMenu.y}
          onAction={(action) =>
            handleTranscriptionMenuAction(
              transcriptionContextMenu.nodeId,
              action,
            )
          }
          onClose={() => setTranscriptionContextMenu(null)}
        />
      )}

      {showUnsplash && (
        <UnsplashSearchModal
          onClose={() => setShowUnsplash(false)}
          onSelectImage={handleUnsplashSelect}
        />
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(event) => {
          const files = event.currentTarget.files;
          if (!files || files.length === 0) {
            event.currentTarget.value = "";
            return;
          }
          const fileArray = Array.from(files);
          window.dispatchEvent(
            new CustomEvent("canvasai:file-import", {
              detail: { files: fileArray },
            }),
          );
          event.currentTarget.value = "";
        }}
      />
    </div>
  );
}
