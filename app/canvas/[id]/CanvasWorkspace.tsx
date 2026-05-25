"use client";

import type {
  CSSProperties,
  DragEvent as ReactDragEvent,
  PointerEvent as ReactPointerEvent,
  WheelEvent,
} from "react";
import { useEffect, useMemo, useRef, useState } from "react";

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
  position: Point;
  size: {
    width: number;
    height: number;
  };
  zIndex: number;
};

type ImageDragState = {
  nodeId: string;
  offset: Point;
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
  isLoading: boolean;
};

type WebDragState = {
  nodeId: string;
  offset: Point;
};

type ResizeCorner = "top-left" | "top-right" | "bottom-left" | "bottom-right";

type ImageResizeState = {
  nodeId: string;
  corner: ResizeCorner;
  startPoint: Point;
  startPosition: Point;
  startSize: {
    width: number;
    height: number;
  };
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

export default function CanvasWorkspace() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const imageNodesRef = useRef<ImageCanvasNode[]>([]);
  const webNodesRef = useRef<WebCanvasNode[]>([]);
  const imageDragRef = useRef<ImageDragState | null>(null);
  const imageResizeRef = useRef<ImageResizeState | null>(null);
  const webDragRef = useRef<WebDragState | null>(null);
  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, zoom: 1 });
  const [showGridControls, setShowGridControls] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [backgroundColor, setBackgroundColor] = useState("#111111");
  const [gridColor, setGridColor] = useState("#343434");
  const [gridSize, setGridSize] = useState(32);
  const [isFileDragging, setIsFileDragging] = useState(false);
  const [draggingImageNodeId, setDraggingImageNodeId] = useState<string | null>(
    null
  );
  const [resizingImageNodeId, setResizingImageNodeId] = useState<string | null>(
    null
  );
  const [imageNodes, setImageNodes] = useState<ImageCanvasNode[]>([]);
  const [webNodes, setWebNodes] = useState<WebCanvasNode[]>([]);
  const gridSizePercent = ((gridSize - 12) / (80 - 12)) * 100;

  useEffect(() => {
    imageNodesRef.current = imageNodes;
  }, [imageNodes]);

  useEffect(() => {
    webNodesRef.current = webNodes;
  }, [webNodes]);

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
      imageNodesRef.current.forEach((node) => URL.revokeObjectURL(node.url));
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
            x: center.x - 160,
            y: center.y - 120,
          },
          size: {
            width: 320,
            height: 240,
          },
          zIndex: topZIndex + 1,
          isLoading: true,
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

    const droppedNodes = await Promise.all(
      files.map(async (file, index) => {
        const url = URL.createObjectURL(file);
        const naturalSize = await getNaturalImageSize(url);

        return {
          id: crypto.randomUUID(),
          fileName: file.name,
          url,
          position: {
            x: dropPosition.x + index * 20,
            y: dropPosition.y + index * 20,
          },
          size: fitImageSize(naturalSize.width, naturalSize.height),
          zIndex: index + 1,
        };
      })
    );

    setImageNodes((current) => {
      const topZIndex = current.reduce(
        (max, node) => Math.max(max, node.zIndex),
        0
      );
      const nextNodes = droppedNodes.map((node, index) => ({
        ...node,
        zIndex: topZIndex + index + 1,
      }));

      return [...current, ...nextNodes];
    });
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

    const point = screenToCanvas({ x: event.clientX, y: event.clientY });
    imageDragRef.current = {
      nodeId: node.id,
      offset: {
        x: point.x - node.position.x,
        y: point.y - node.position.y,
      },
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

  function handleImagePointerMove(event: ReactPointerEvent<HTMLElement>) {
    const dragState = imageDragRef.current;
    const resizeState = imageResizeRef.current;

    if (resizeState) {
      const point = screenToCanvas({ x: event.clientX, y: event.clientY });
      const deltaX = point.x - resizeState.startPoint.x;
      const deltaY = point.y - resizeState.startPoint.y;
      const ratio = resizeState.startSize.width / resizeState.startSize.height;
      const horizontalSign = resizeState.corner.includes("right") ? 1 : -1;
      const verticalSign = resizeState.corner.includes("bottom") ? 1 : -1;
      const widthFromX =
        resizeState.startSize.width + deltaX * horizontalSign;
      const widthFromY =
        resizeState.startSize.width + deltaY * verticalSign * ratio;
      const nextWidth = Math.max(
        40,
        Math.round(Math.abs(widthFromX) > Math.abs(widthFromY) ? widthFromX : widthFromY)
      );
      const nextHeight = Math.max(40, Math.round(nextWidth / ratio));

      setImageNodes((current) =>
        current.map((node) => {
          if (node.id !== resizeState.nodeId) {
            return node;
          }

          const nextPosition = { ...resizeState.startPosition };

          if (resizeState.corner.includes("left")) {
            nextPosition.x =
              resizeState.startPosition.x +
              resizeState.startSize.width -
              nextWidth;
          }

          if (resizeState.corner.includes("top")) {
            nextPosition.y =
              resizeState.startPosition.y +
              resizeState.startSize.height -
              nextHeight;
          }

          return {
            ...node,
            position: nextPosition,
            size: {
              width: nextWidth,
              height: nextHeight,
            },
          };
        })
      );

      return;
    }

    if (!dragState) {
      return;
    }

    const point = screenToCanvas({ x: event.clientX, y: event.clientY });

    setImageNodes((current) =>
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

  function handleImagePointerUp(event: ReactPointerEvent<HTMLElement>) {
    imageDragRef.current = null;
    imageResizeRef.current = null;
    setDraggingImageNodeId(null);
    setResizingImageNodeId(null);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function handleWebDragPointerDown(
    event: ReactPointerEvent<HTMLDivElement>,
    node: WebCanvasNode
  ) {
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
    };

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

  function handleWebPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const dragState = webDragRef.current;

    if (!dragState) {
      return;
    }

    const point = screenToCanvas({ x: event.clientX, y: event.clientY });

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

  function handleWebPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    webDragRef.current = null;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function handleWebsiteLoad(nodeId: string) {
    setWebNodes((current) =>
      current.map((node) =>
        node.id === nodeId ? { ...node, isLoading: false } : node
      )
    );
  }

  function handleResizePointerDown(
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
        style={{
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
          transformOrigin: "0 0",
        }}
      >
        {imageNodes.map((node) => (
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
            {/* Object URLs from local drops are not compatible with next/image optimization. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt={node.fileName}
              className="block h-full w-full select-none object-contain"
              draggable={false}
              src={node.url}
            />
            <div
              className={[
                "pointer-events-none absolute -inset-px border border-[#0d99ff] transition",
                resizingImageNodeId === node.id
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
                aria-label={`Resize image from ${corner}`}
                className={[
                  "absolute h-3 w-3 border border-[#0d99ff] bg-white transition",
                  resizingImageNodeId === node.id
                    ? "opacity-100"
                    : "opacity-0 group-hover:opacity-100",
                  className,
                ].join(" ")}
                type="button"
                onPointerCancel={handleImagePointerUp}
                onPointerDown={(event) =>
                  handleResizePointerDown(event, node, corner)
                }
                onPointerMove={handleImagePointerMove}
                onPointerUp={handleImagePointerUp}
              />
            ))}
          </div>
        ))}

        {webNodes.map((node) => (
          <div
            key={node.id}
            className="absolute overflow-hidden rounded-lg border border-white/15 bg-zinc-950 shadow-[0_18px_46px_rgba(0,0,0,0.34)]"
            onPointerCancel={handleWebPointerUp}
            onPointerMove={handleWebPointerMove}
            onPointerUp={handleWebPointerUp}
            style={{
              height: node.size.height,
              left: node.position.x,
              top: node.position.y,
              width: node.size.width,
              zIndex: node.zIndex,
            }}
          >
            <div
              className="flex h-9 cursor-grab items-center gap-2 border-b border-white/10 bg-zinc-950 px-2 text-white active:cursor-grabbing"
              onPointerDown={(event) => handleWebDragPointerDown(event, node)}
            >
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              <span className="min-w-0 flex-1 truncate text-xs font-medium">
                {node.title}
              </span>
              <a
                aria-label={`Open ${node.title} in a new tab`}
                className="rounded-md px-1.5 py-1 text-[11px] text-white/55 transition hover:bg-white/10 hover:text-white"
                href={node.url}
                rel="noreferrer"
                target="_blank"
              >
                Open
              </a>
            </div>
            <div className="relative h-[calc(100%-36px)] bg-white">
              {node.isLoading && (
                <div className="absolute inset-0 z-10 grid place-items-center bg-zinc-950 text-white">
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                    <div className="text-xs text-white/60">Loading preview</div>
                  </div>
                </div>
              )}
              <iframe
                className="h-full w-full bg-white"
                onLoad={() => handleWebsiteLoad(node.id)}
                referrerPolicy="no-referrer"
                sandbox="allow-forms allow-popups allow-same-origin allow-scripts"
                src={node.url}
                title={node.title}
              />
            </div>
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
    </div>
  );
}
