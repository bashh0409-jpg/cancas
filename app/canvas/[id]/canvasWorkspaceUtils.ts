import type { ImageCanvasNode, VoiceCanvasNode } from "./canvasWorkspaceTypes";

export const MIN_ZOOM = 0.001;
export const MAX_ZOOM = 100;
export const ZOOM_SCALE_FACTOR = 1.2;

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function parseHexColor(value: string) {
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

export function parseRgbColor(value: string) {
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

export function parseColor(value: string) {
  if (!value) return null;
  const hex = parseHexColor(value);
  if (hex) return hex;
  const rgb = parseRgbColor(value);
  if (rgb) return rgb;
  return null;
}

export function isLightColor(value: string) {
  const rgb = parseColor(value);

  if (!rgb) {
    return false;
  }

  const luminance = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;

  return luminance > 180;
}

export function getNaturalImageSize(url: string) {
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

export function fitImageSize(width: number, height: number) {
  const maxWidth = 520;
  const maxHeight = 380;
  const scale = Math.min(1, maxWidth / width, maxHeight / height);

  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

export function getUrlFromText(text: string) {
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

export function getWebsiteTitle(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "Website";
  }
}

export function normalizeRect(
  start: { x: number; y: number },
  end: { x: number; y: number },
) {
  return {
    x: Math.min(start.x, end.x),
    y: Math.min(start.y, end.y),
    width: Math.abs(end.x - start.x),
    height: Math.abs(end.y - start.y),
  };
}

export function isPendingCloudSync(node: ImageCanvasNode) {
  return !node.storagePath;
}

export function getImageNodeSrc(node: ImageCanvasNode) {
  const url = node.url.trim();

  return url.length > 0 ? url : null;
}

export function serializeImageNodeForSave(node: ImageCanvasNode) {
  const pending = isPendingCloudSync(node);

  return {
    id: node.id,
    fileName: node.fileName,
    url: pending && node.url.startsWith("blob:") ? "" : node.url,
    storagePath: node.storagePath,
    fileSizeBytes: node.fileSizeBytes,
    position: node.position,
    size: node.size,
    zIndex: node.zIndex,
    visible: node.visible,
    locked: node.locked,
    transform: node.transform,
  };
}

export function serializeVoiceNodeForSave(node: VoiceCanvasNode) {
  return {
    id: node.id,
    title: node.title,
    // When storagePath exists, avoid persisting large data URLs
    ...(node.storagePath ? {} : { audioDataUrl: node.audioDataUrl ?? "" }),
    storagePath: node.storagePath,
    durationMs: node.durationMs,
    position: node.position,
    size: node.size,
    zIndex: node.zIndex,
    visible: node.visible,
    locked: node.locked,
  };
}

export function imageIntersectsRect(
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
