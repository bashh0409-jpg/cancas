export type CanvasViewport = {
  x: number;
  y: number;
  zoom: number;
};

export type CanvasGridLineType = "solid" | "dotted";

export type CanvasImageNode = {
  id: string;
  fileName: string;
  url: string;
  storagePath?: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  visible?: boolean;
  locked?: boolean;
  transform?: {
    flipH?: boolean;
    flipV?: boolean;
    rotation?: number;
  };
};

export type CanvasWebNode = {
  id: string;
  url: string;
  title: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  visible?: boolean;
  locked?: boolean;
};

export type CanvasVoiceNode = {
  id: string;
  title: string;
  audioDataUrl: string;
  durationMs: number;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  visible?: boolean;
  locked?: boolean;
};

export type CanvasTextNode = {
  id: string;
  text: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  visible?: boolean;
  locked?: boolean;
  style: {
    backgroundColor: string;
    color: string;
    fontFamily: string;
    fontSize: number;
  };
};

export type CanvasAiChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
};

export type CanvasAiChatNode = {
  id: string;
  sourceNodeId?: string;
  name: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  visible?: boolean;
  locked?: boolean;
  style: {
    backgroundColor: string;
    color: string;
    fontFamily: string;
    fontSize: number;
  };
  messages: CanvasAiChatMessage[];
};

export type CanvasTranscriptionNode = {
  id: string;
  sourceNodeId?: string; // ID of the voice node this transcription came from
  text: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  visible?: boolean;
  locked?: boolean;
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
  aiChatNodes: CanvasAiChatNode[];
  transcriptionNodes: CanvasTranscriptionNode[];
  showGrid: boolean;
  backgroundColor: string;
  gridColor: string;
  gridSize: number;
  gridLineType: CanvasGridLineType;
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
  deleted_at?: string;
};

export const EMPTY_CANVAS_CONTENT: CanvasContent = {
  version: 1,
  viewport: { x: 0, y: 0, zoom: 1 },
  imageNodes: [],
  webNodes: [],
  voiceNodes: [],
  textNodes: [],
  aiChatNodes: [],
  transcriptionNodes: [],
  showGrid: true,
  backgroundColor: "#111111",
  gridColor: "#343434",
  gridSize: 32,
  gridLineType: "solid",
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
      aiChatNodes: Array.isArray(record.aiChatNodes)
        ? (record.aiChatNodes as CanvasAiChatNode[])
        : [],
      transcriptionNodes: Array.isArray(record.transcriptionNodes)
        ? (record.transcriptionNodes as CanvasTranscriptionNode[])
        : [],
      showGrid: typeof record.showGrid === "boolean" ? record.showGrid : true,
    backgroundColor:
      typeof record.backgroundColor === "string"
        ? record.backgroundColor
        : "#111111",
    gridColor:
      typeof record.gridColor === "string" ? record.gridColor : "#343434",
    gridSize: typeof record.gridSize === "number" ? record.gridSize : 32,
    gridLineType:
      record.gridLineType === "dotted" || record.gridLineType === "solid"
        ? record.gridLineType
        : "solid",
  };
}
