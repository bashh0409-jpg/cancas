export type CanvasViewport = {
  x: number;
  y: number;
  zoom: number;
};

export type CanvasImageNode = {
  id: string;
  fileName: string;
  url: string;
  storagePath?: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
};

export type CanvasWebNode = {
  id: string;
  url: string;
  title: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
};

export type CanvasVoiceNode = {
  id: string;
  title: string;
  audioDataUrl: string;
  durationMs: number;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
};

export type CanvasTextNode = {
  id: string;
  text: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  style: {
    backgroundColor: string;
    color: string;
    fontFamily: string;
    fontSize: number;
  };
};

export type CanvasContent = {
  version: 1;
  viewport: CanvasViewport;
  imageNodes: CanvasImageNode[];
  webNodes: CanvasWebNode[];
  voiceNodes: CanvasVoiceNode[];
  textNodes: CanvasTextNode[];
  showGrid: boolean;
  backgroundColor: string;
  gridColor: string;
  gridSize: number;
};

export type CanvasRecord = {
  id: string;
  slug: string;
  name: string;
  content: CanvasContent | Record<string, never>;
  created_at: string;
  updated_at: string;
};

export type CanvasListItem = {
  id: string;
  slug: string;
  name: string;
  created_at: string;
  updated_at: string;
};

export const EMPTY_CANVAS_CONTENT: CanvasContent = {
  version: 1,
  viewport: { x: 0, y: 0, zoom: 1 },
  imageNodes: [],
  webNodes: [],
  voiceNodes: [],
  textNodes: [],
  showGrid: true,
  backgroundColor: "#111111",
  gridColor: "#343434",
  gridSize: 32,
};

export function parseCanvasContent(value: unknown): CanvasContent | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;

  if (record.version !== 1) {
    return null;
  }

  const viewport = record.viewport;

  if (
    typeof viewport !== "object" ||
    viewport === null ||
    Array.isArray(viewport)
  ) {
    return null;
  }

  const viewportRecord = viewport as Record<string, unknown>;

  if (
    typeof viewportRecord.x !== "number" ||
    typeof viewportRecord.y !== "number" ||
    typeof viewportRecord.zoom !== "number"
  ) {
    return null;
  }

  return {
    version: 1,
    viewport: {
      x: viewportRecord.x,
      y: viewportRecord.y,
      zoom: viewportRecord.zoom,
    },
    imageNodes: Array.isArray(record.imageNodes)
      ? (record.imageNodes as CanvasImageNode[])
      : [],
    webNodes: Array.isArray(record.webNodes)
      ? (record.webNodes as CanvasWebNode[])
      : [],
    voiceNodes: Array.isArray(record.voiceNodes)
      ? (record.voiceNodes as CanvasVoiceNode[])
      : [],
    textNodes: Array.isArray(record.textNodes)
      ? (record.textNodes as CanvasTextNode[])
      : [],
    showGrid: typeof record.showGrid === "boolean" ? record.showGrid : true,
    backgroundColor:
      typeof record.backgroundColor === "string"
        ? record.backgroundColor
        : "#111111",
    gridColor:
      typeof record.gridColor === "string" ? record.gridColor : "#343434",
    gridSize: typeof record.gridSize === "number" ? record.gridSize : 32,
  };
}
