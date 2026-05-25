"use client";

import type {
  CSSProperties,
  DragEvent as ReactDragEvent,
  PointerEvent as ReactPointerEvent,
  WheelEvent,
} from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ImageSelectionArrangeBar } from "@/app/components/canvas/ImageSelectionArrangeBar";
import { WebsitePreviewCard } from "@/app/components/website-preview/WebsitePreviewCard";
import { WebsitePreviewModal } from "@/app/components/website-preview/WebsitePreviewModal";
import {
  arrangeImagesFromRequest,
  getSelectionOrigin,
  type LayoutArrangeRequest,
} from "@/lib/canvas/imageLayouts";
import {
  deletePendingUploadFile,
  getPendingUploadFile,
  savePendingUploadFile,
} from "@/lib/canvas/pendingUploads";
import { deleteCanvasImage, uploadCanvasImage } from "@/lib/canvas/storage";
import { canvasImageUploadPool } from "@/lib/canvas/uploadPool";
import { createClient } from "@/lib/supabase/client";
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

type ResizeCorner = "top-left" | "top-right" | "bottom-left" | "bottom-right";

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

function imageIntersectsRect(node: ImageCanvasNode, rect: ReturnType<typeof normalizeRect>) {
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
  serverUpdatedAt: string
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
      typeof parsedDraft.syncedAt === "string" ? parsedDraft.syncedAt : undefined;

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
    const isNewerThanServer = Number.isNaN(serverTime) || savedTime > serverTime;

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
  syncedAt?: string
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

    window.localStorage.setItem(getLocalDraftKey(canvasId), JSON.stringify(draft));
  } catch {
    // localStorage can be full or unavailable; Supabase autosave still runs.
  }
}

function markLocalCanvasDraftSynced(
  canvasId: string,
  content: CanvasContent,
  serverUpdatedAt: string
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

    window.localStorage.setItem(getLocalDraftKey(canvasId), JSON.stringify(draft));
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
}: CanvasWorkspaceProps) {
  const initialImageIdsRef = useRef(
    new Set(initialContent.imageNodes.map((node) => node.id))
  );
  const canvasRef = useRef<HTMLDivElement>(null);
  const imageNodesRef = useRef<ImageCanvasNode[]>(initialContent.imageNodes);
  const webNodesRef = useRef<WebCanvasNode[]>([]);
  const imageDragRef = useRef<ImageDragState | null>(null);
  const imageResizeRef = useRef<NodeResizeState | null>(null);
  const webDragRef = useRef<WebDragState | null>(null);
  const webResizeRef = useRef<NodeResizeState | null>(null);
  const skipSaveRef = useRef(true);
  const [isClientReady, setIsClientReady] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingUploadFilesRef = useRef<
    Map<string, { file: File; blobUrl: string }>
  >(new Map());
  const pendingUploadIdsRef = useRef<Set<string>>(new Set());
  const supabaseClientRef = useRef(createClient());
  const [viewport, setViewport] = useState<Viewport>(initialContent.viewport);
  const [showGridControls, setShowGridControls] = useState(false);
  const [showGrid, setShowGrid] = useState(initialContent.showGrid);
  const [backgroundColor, setBackgroundColor] = useState(
    initialContent.backgroundColor
  );
  const [gridColor, setGridColor] = useState(initialContent.gridColor);
  const [gridSize, setGridSize] = useState(initialContent.gridSize);
  const [isFileDragging, setIsFileDragging] = useState(false);
  const [draggingImageNodeId, setDraggingImageNodeId] = useState<string | null>(
    null
  );
  const [resizingImageNodeId, setResizingImageNodeId] = useState<string | null>(
    null
  );
  const [resizingWebNodeId, setResizingWebNodeId] = useState<string | null>(
    null
  );
  const [draggingWebNodeId, setDraggingWebNodeId] = useState<string | null>(null);
  const [imageNodes, setImageNodes] = useState<ImageCanvasNode[]>(
    initialContent.imageNodes
  );
  const [webNodes, setWebNodes] = useState<WebCanvasNode[]>(initialContent.webNodes);
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
    [selectedImageIds]
  );
  
  const cloudSyncedCount = useMemo(
    () => imageNodes.filter((node) => Boolean(node.storagePath)).length,
    [imageNodes]
  );
  const totalImageCount = imageNodes.length;
  const marqueeRect = marquee ? normalizeRect(marquee.start, marquee.current) : null;

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
      imageNodesRef.current = content.imageNodes;
      webNodesRef.current = content.webNodes;
      initialImageIdsRef.current = new Set(
        content.imageNodes.map((node) => node.id)
      );
      setSettledInitialImageIds(new Set());
      skipSaveRef.current = true;
    } else {
      skipSaveRef.current = false;
    }

    setIsClientReady(true);
  }, [canvasId, serverUpdatedAt]);

  useEffect(() => {
    if (!isClientReady) {
      return;
    }

    let cancelled = false;

    async function resumePendingUploads() {
      const nodesNeedingSync = imageNodesRef.current.filter((node) =>
        isPendingCloudSync(node)
      );

      const nodesToResume = [];

      for (const node of nodesNeedingSync) {
        if (cancelled || pendingUploadFilesRef.current.has(node.id)) {
          continue;
        }

        const file = await getPendingUploadFile(canvasId, node.id);

        if (!file) {
          continue;
        }

        const blobUrl = URL.createObjectURL(file);

        pendingUploadFilesRef.current.set(node.id, { file, blobUrl });
        pendingUploadIdsRef.current.add(node.id);

        setImageNodes((current) =>
          current.map((entry) =>
            entry.id === node.id ? { ...entry, url: blobUrl } : entry
          )
        );

        nodesToResume.push({ nodeId: node.id, file, blobUrl });
      }

      for (const entry of nodesToResume) {
        if (cancelled) {
          return;
        }

        canvasImageUploadPool.enqueue(() =>
          syncImageToStorage(entry.nodeId, entry.file, entry.blobUrl)
        );
      }
    }

    void resumePendingUploads();

    return () => {
      cancelled = true;
    };
  }, [canvasId, userId, isClientReady]);

  const removeImageNodes = useCallback((ids: string[]) => {
    if (ids.length === 0) {
      return;
    }

    const nodesToRemove = imageNodesRef.current.filter((node) =>
      ids.includes(node.id)
    );
    const supabase = supabaseClientRef.current;

    for (const node of nodesToRemove) {
      if (node.url.startsWith("blob:")) {
        URL.revokeObjectURL(node.url);
      }

      pendingUploadFilesRef.current.delete(node.id);
      pendingUploadIdsRef.current.delete(node.id);
      void deletePendingUploadFile(canvasId, node.id);

      if (node.storagePath) {
        void deleteCanvasImage(supabase, node.storagePath).catch(() => {
          // Best-effort storage cleanup.
        });
      }
    }

    setImageNodes((current) => current.filter((node) => !ids.includes(node.id)));
    setSelectedImageIds((current) =>
      current.filter((id) => !ids.includes(id))
    );
  }, []);

  useEffect(() => {
    imageNodesRef.current = imageNodes;
  }, [imageNodes]);

  useEffect(() => {
    webNodesRef.current = webNodes;
  }, [webNodes]);

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
          initialImageIdsRef.current.has(node.id) && getImageNodeSrc(node) === null
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
  ]);

  useEffect(() => {
    if (skipSaveRef.current) {
      skipSaveRef.current = false;
      return;
    }

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    const content = buildCanvasContent();
    writeLocalCanvasDraft(canvasId, content, serverUpdatedAt);

    saveTimerRef.current = setTimeout(() => {
      void fetch(`/api/canvases/${canvasId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          name: canvasName,
        }),
      }).then((response) => {
        if (response.ok) {
          markLocalCanvasDraftSynced(canvasId, content, serverUpdatedAt);
        }
      }).catch(() => {
        // Keep the local draft dirty so the next page load can recover it.
      });
    }, 1200);

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [buildCanvasContent, canvasId, canvasName, serverUpdatedAt]);

  useEffect(() => {
    function flushDraft() {
      writeLocalCanvasDraft(canvasId, buildCanvasContent(), serverUpdatedAt);
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "hidden") {
        flushDraft();
      }
    }

    window.addEventListener("beforeunload", flushDraft);
    window.addEventListener("pagehide", flushDraft);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", flushDraft);
      window.removeEventListener("pagehide", flushDraft);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      flushDraft();
    };
  }, [buildCanvasContent, canvasId, serverUpdatedAt]);

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
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [removeImageNodes, selectedImageIdSet]);

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
    };
  }, []);

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
        ...webNodesRef.current.map((node) => node.zIndex)
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
      setViewport((current) => ({
        ...current,
        zoom: clamp(current.zoom - event.deltaY * 0.0015, 0.2, 4),
      }));
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
      0.2,
      4
    );

    setViewport({
      x: rect.width / 2 - centerX * zoom,
      y: rect.height / 2 - centerY * zoom,
      zoom,
    });
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

  async function syncImageToStorage(nodeId: string, file: File, blobUrl: string) {
    try {
      const uploaded = await uploadCanvasImage(
        supabaseClientRef.current,
        userId,
        canvasId,
        nodeId,
        file
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
            : node
        )
      );

      URL.revokeObjectURL(blobUrl);
      pendingUploadFilesRef.current.delete(nodeId);
      await deletePendingUploadFile(canvasId, nodeId);
    } catch {
      // Keep pending state so a later visit can retry the upload.
    }
  }

  async function handleDrop(event: ReactDragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    setIsFileDragging(false);

    const files = Array.from(event.dataTransfer.files).filter((file) =>
      file.type.startsWith("image/")
    );

    if (files.length === 0) {
      return;
    }

    const dropPosition = screenToCanvas({
      x: event.clientX,
      y: event.clientY,
    });

    const placeholderNodes = await Promise.all(
      files.map(async (file, index) => {
        const nodeId = crypto.randomUUID();
        const blobUrl = URL.createObjectURL(file);
        const naturalSize = await getNaturalImageSize(blobUrl);

        await savePendingUploadFile(canvasId, nodeId, file);

        pendingUploadFilesRef.current.set(nodeId, { file, blobUrl });
        pendingUploadIdsRef.current.add(nodeId);

        const node = {
          id: nodeId,
          fileName: file.name,
          url: blobUrl,
          position: {
            x: dropPosition.x + index * 20,
            y: dropPosition.y + index * 20,
          },
          size: fitImageSize(naturalSize.width, naturalSize.height),
          zIndex: index + 1,
        };

        canvasImageUploadPool.enqueue(() =>
          syncImageToStorage(nodeId, file, blobUrl)
        );

        return node;
      })
    );

    setImageNodes((current) => {
      const topZIndex = current.reduce(
        (max, node) => Math.max(max, node.zIndex),
        0
      );
      const nextNodes = placeholderNodes.map((node, index) => ({
        ...node,
        zIndex: topZIndex + index + 1,
      }));

      const nextIds = nextNodes.map((node) => node.id);

      if (nextIds.length >= 2) {
        setSelectedImageIds(nextIds);
      }

      return [...current, ...nextNodes];
    });
  }

  function applyImageLayout(request: LayoutArrangeRequest) {
    const selected = imageNodes.filter((node) =>
      selectedImageIdSet.has(node.id)
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
      request
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
      })
    );
  }

  function handleCanvasPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget || event.button !== 0) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);

    const point = screenToCanvas({ x: event.clientX, y: event.clientY });
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
        : null
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
        marquee.additive
          ? [...new Set([...current, ...hitIds])]
          : hitIds
      );
    }

    setMarquee(null);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function handleImagePointerDown(
    event: ReactPointerEvent<HTMLDivElement>,
    node: ImageCanvasNode
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
        .map((entry) => [entry.id, entry.position])
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
        0
      );

      return current.map((entry) =>
        entry.id === node.id ? { ...entry, zIndex: topZIndex + 1 } : entry
      );
    });
  }

  function getResizedNodeBounds(
    resizeState: NodeResizeState,
    point: Point
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
            : node
        )
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
      })
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
    node: WebCanvasNode
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
        ...current.map((entry) => entry.zIndex)
      );

      return current.map((entry) =>
        entry.id === node.id ? { ...entry, zIndex: topZIndex + 1 } : entry
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
            : node
        )
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
      point.y - dragState.startPoint.y
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
          : node
      )
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
    corner: ResizeCorner
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
        0
      );

      return current.map((entry) =>
        entry.id === node.id ? { ...entry, zIndex: topZIndex + 1 } : entry
      );
    });
  }

  function handleWebResizePointerDown(
    event: ReactPointerEvent<HTMLButtonElement>,
    node: WebCanvasNode,
    corner: ResizeCorner
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
        ...current.map((entry) => entry.zIndex)
      );

      return current.map((entry) =>
        entry.id === node.id ? { ...entry, zIndex: topZIndex + 1 } : entry
      );
    });
  }

  return (
    <div
      ref={canvasRef}
      className="absolute inset-0 cursor-grab overflow-hidden"
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
          <div
            aria-hidden
            className="pointer-events-none absolute border border-[#0d99ff] bg-[#0d99ff]/10"
            style={{
              height: marqueeRect.height,
              left: marqueeRect.x,
              top: marqueeRect.y,
              width: marqueeRect.width,
              zIndex: 9999,
            }}
          />
        )}

        {imageNodes.map((node) => {
          const isSelected = selectedImageIdSet.has(node.id);
          const showResizeHandles =
            isSelected && selectedImageIds.length === 1;
          const imageSrc = getImageNodeSrc(node);

          return (
            <div
              key={node.id}
              className="group absolute"
              onPointerCancel={handleImagePointerUp}
              onPointerDown={(event) => handleImagePointerDown(event, node)}
              onPointerMove={handleImagePointerMove}
              onPointerUp={handleImagePointerUp}
              style={{
                cursor: draggingImageNodeId === node.id ? "grabbing" : "grab",
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
                    onError={() => handleInitialImageSettled(node.id)}
                    onLoad={() => handleInitialImageSettled(node.id)}
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
                  resizingImageNodeId === node.id ? "opacity-100" : "",
                ].join(" ")}
              />
              {showResizeHandles
                ? (
                    [
                      ["top-left", "-left-1.5 -top-1.5 cursor-nwse-resize"],
                      ["top-right", "-right-1.5 -top-1.5 cursor-nesw-resize"],
                      ["bottom-left", "-bottom-1.5 -left-1.5 cursor-nesw-resize"],
                      [
                        "bottom-right",
                        "-bottom-1.5 -right-1.5 cursor-nwse-resize",
                      ],
                    ] as const
                  ).map(([corner, className]) => (
                    <button
                      key={corner}
                      aria-label={`Resize image from ${corner}`}
                      className={[
                        "absolute h-3 w-3 border border-[#0d99ff] bg-white transition",
                        resizingImageNodeId === node.id || isSelected
                          ? "opacity-100"
                          : "opacity-0 group-hover:opacity-100",
                        className,
                      ].join(" ")}
                      type="button"
                      onPointerCancel={handleImagePointerUp}
                      onPointerDown={(event) =>
                        handleImageResizePointerDown(event, node, corner)
                      }
                      onPointerMove={handleImagePointerMove}
                      onPointerUp={handleImagePointerUp}
                    />
                  ))
                : null}
            </div>
          );
        })}

        {webNodes.map((node) => (
          <div
            key={node.id}
            className="group absolute"
            onPointerCancel={handleWebPointerUp}
            onPointerDown={(event) => handleWebPointerDown(event, node)}
            onPointerMove={handleWebPointerMove}
            onPointerUp={(event) => {
              const { didDrag, didResize } = handleWebPointerUp(event);

              if (!didDrag && !didResize) {
                setActiveWebNodeId(node.id);
              }
            }}
            style={{
              cursor: draggingWebNodeId === node.id ? "grabbing" : "grab",
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
                "pointer-events-none absolute -inset-px rounded-lg border border-[#0d99ff] transition",
                resizingWebNodeId === node.id
                  ? "opacity-100"
                  : "opacity-0 group-hover:opacity-100",
              ].join(" ")}
            />
            {(
              [
                ["top-left", "-left-1.5 -top-1.5 cursor-nwse-resize"],
                ["top-right", "-right-1.5 -top-1.5 cursor-nesw-resize"],
                ["bottom-left", "-bottom-1.5 -left-1.5 cursor-nesw-resize"],
                ["bottom-right", "-bottom-1.5 -right-1.5 cursor-nwse-resize"],
              ] as const
            ).map(([corner, className]) => (
              <button
                key={corner}
                aria-label={`Resize link preview from ${corner}`}
                className={[
                  "absolute h-3 w-3 border border-[#0d99ff] bg-white transition",
                  resizingWebNodeId === node.id
                    ? "opacity-100"
                    : "opacity-0 group-hover:opacity-100",
                  className,
                ].join(" ")}
                type="button"
                onPointerCancel={handleWebPointerUp}
                onPointerDown={(event) =>
                  handleWebResizePointerDown(event, node, corner)
                }
                onPointerMove={handleWebPointerMove}
                onPointerUp={handleWebPointerUp}
              />
            ))}
          </div>
        ))}
      </div>

      <div
        aria-hidden={!isFileDragging}
        className={[
          "pointer-events-none absolute inset-4 z-30 grid place-items-center rounded-xl border border-dashed text-sm font-medium text-white transition",
          isFileDragging
            ? "border-[#0d99ff]/70 bg-[#0d99ff]/10 opacity-100"
            : "border-white/0 bg-transparent opacity-0",
        ].join(" ")}
      >
        Drop images onto the canvas
      </div>

      <div
        className="absolute left-4 top-1/2 z-40 -translate-y-1/2 text-white"
        onWheel={(event) => event.stopPropagation()}
      >
        <button
          aria-expanded={showGridControls}
          aria-label="Grid settings"
          className={[
            "flex h-11 w-11 items-center justify-center rounded-xl border shadow-[0_12px_32px_rgba(0,0,0,0.38)] backdrop-blur transition duration-200",
            showGridControls
              ? "border-[#0d99ff] bg-[#0d99ff] text-white"
              : "border-white/10 bg-zinc-950/90 text-white/75 hover:bg-zinc-900",
          ].join(" ")}
          type="button"
          onClick={() => setShowGridControls((current) => !current)}
        >
          <svg
            aria-hidden="true"
            className={[
              "h-5 w-5 transition duration-300",
              showGridControls ? "rotate-45 scale-95" : "rotate-0 scale-100",
            ].join(" ")}
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              d="M8 3v18M16 3v18M3 8h18M3 16h18"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="1.7"
            />
          </svg>
        </button>

        <aside
          aria-hidden={!showGridControls}
          className={[
            "absolute left-14 top-1/2 w-64 rounded-lg border border-white/10 bg-zinc-950/90 p-3 text-sm shadow-[0_18px_48px_rgba(0,0,0,0.42)] backdrop-blur",
            "origin-left transition-[opacity,filter,transform,clip-path] duration-300 ease-[cubic-bezier(.18,.89,.32,1.18)]",
            showGridControls
              ? "pointer-events-auto opacity-100 blur-0"
              : "pointer-events-none opacity-0 blur-sm",
          ].join(" ")}
          style={{
            clipPath: showGridControls
              ? "inset(0% 0% 0% 0% round 12px)"
              : "inset(30% 78% 30% 0% round 999px)",
            transform: showGridControls
              ? "translateY(-50%) translateX(0) scaleX(1) scaleY(1) skewY(0deg)"
              : "translateY(-50%) translateX(-24px) scaleX(0.2) scaleY(0.46) skewY(-7deg)",
          }}
        >
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-white/45">
                  Canvas
                </div>
                <div className="mt-0.5 text-sm font-medium text-white">
                  Grid 
                </div>
              </div>
              <button
                aria-label={showGrid ? "Hide grid" : "Show grid"}
                aria-pressed={showGrid}
                className={[
                  "group relative h-8 w-14 overflow-hidden rounded-sm border p-0.5 transition",
                  showGrid
                    ? "border-[#0d99ff]/70 bg-[#0d99ff]/20"
                    : "border-white/10 bg-white/5 hover:bg-white/10",
                ].join(" ")}
                type="button"
                onClick={() => setShowGrid((current) => !current)}
              >
                <span
                  className={[
                    "absolute inset-y-0 w-1/2 rounded bg-white shadow-[0_4px_14px_rgba(0,0,0,0.34)] transition-transform duration-200",
                    showGrid ? "translate-x-[24px]" : "translate-x-0",
                  ].join(" ")}
                />
                <span
                  className={[
                    "relative z-10 inline-flex h-full w-1/2 items-center justify-center text-[10px] font-semibold transition",
                    showGrid ? "text-white/45" : "text-zinc-950",
                  ].join(" ")}
                >
                  Off
                </span>
                <span
                  className={[
                    "relative z-10 inline-flex h-full w-1/2 items-center justify-center text-[10px] font-semibold transition",
                    showGrid ? "text-zinc-950" : "text-white/45",
                  ].join(" ")}
                >
                  On
                </span>
              </button>
            </div>

            <div className="mt-4 grid gap-3">
              <label className="flex items-center justify-between gap-3">
                <span className="text-white/70">Canvas color</span>
                <span className="flex items-center gap-2">
                  <span
                    className="h-6 w-6 rounded-md border border-white/20"
                    style={{ backgroundColor }}
                  />
                  <input
                    aria-label="Canvas color"
                    className="h-8 w-8 cursor-pointer rounded-md border-0 bg-transparent p-0"
                    type="color"
                    value={backgroundColor}
                    onChange={(event) =>
                      setBackgroundColor(event.currentTarget.value)
                    }
                  />
                </span>
              </label>

              <label className="flex items-center justify-between gap-3">
                <span className="text-white/70">Grid color</span>
                <span className="flex items-center gap-2">
                  <span className="grid h-6 w-6 grid-cols-2 overflow-hidden rounded-md border border-white/20">
                    <span style={{ backgroundColor: gridColor }} />
                    <span style={{ backgroundColor }} />
                    <span style={{ backgroundColor }} />
                    <span style={{ backgroundColor: gridColor }} />
                  </span>
                  <input
                    aria-label="Grid color"
                    className="h-8 w-8 cursor-pointer rounded-md border-0 bg-transparent p-0"
                    type="color"
                    value={gridColor}
                    onChange={(event) =>
                      setGridColor(event.currentTarget.value)
                    }
                  />
                </span>
              </label>

              <label className="grid gap-2">
                <span className="flex items-center justify-between text-white/70">
                  <span>Grid size</span>
                  <span className="font-mono text-xs text-white/50">
                    {gridSize}px
                  </span>
                </span>
                <input
                  aria-label="Grid size"
                  className="h-2 w-full cursor-pointer appearance-none rounded-full bg-transparent [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-zinc-950 [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:shadow-[0_3px_12px_rgba(0,0,0,0.42)] [&::-webkit-slider-thumb]:-mt-[5px] [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-zinc-950 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_3px_12px_rgba(0,0,0,0.42)] [&::-webkit-slider-runnable-track]:h-1.5 [&::-webkit-slider-runnable-track]:rounded-full [&::-moz-range-track]:h-1.5 [&::-moz-range-track]:rounded-full"
                  max="80"
                  min="12"
                  step="4"
                  style={{
                    background: `linear-gradient(90deg, #0d99ff 0%, #0d99ff ${gridSizePercent}%, rgba(255,255,255,0.14) ${gridSizePercent}%, rgba(255,255,255,0.14) 100%)`,
                  }}
                  type="range"
                  value={gridSize}
                  onChange={(event) =>
                    setGridSize(Number(event.currentTarget.value))
                  }
                />
              </label>
            </div>
          </aside>
      </div>

      <div
        className="absolute right-4 top-1/2 z-40 -translate-y-1/2 text-white"
        onWheel={(event) => event.stopPropagation()}
      >
        <button
          aria-label="Fit all content to view"
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-zinc-950/90 text-white/75 shadow-[0_12px_32px_rgba(0,0,0,0.38)] backdrop-blur transition hover:bg-zinc-900 hover:text-white"
          title="Fit all content to view"
          type="button"
          onClick={fitContentToView}
        >
          <svg
            aria-hidden
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5M7 12h10M12 7v10"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.7"
            />
          </svg>
        </button>
      </div>

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

      {!isClientReady || isCanvasLoading ? (
        <div
          aria-label="Loading canvas"
          aria-live="polite"
          className="fixed inset-0 z-[100] grid place-items-center bg-black"
          role="status"
        >
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/25 border-t-white" />
        </div>
      ) : null}
    </div>
  );
}
