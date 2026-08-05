const MIME_TO_EXTENSION: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/avif": ".avif",
  "image/heic": ".heic",
  "image/heif": ".heif",
  "audio/webm": ".webm",
  "audio/ogg": ".ogg",
  "audio/mpeg": ".mp3",
  "audio/wav": ".wav",
};

export function getStorageFileExtension(file: File) {
  const fromName = file.name.match(/(\.[a-z0-9]{1,8})$/i)?.[1]?.toLowerCase();

  if (fromName) {
    return fromName;
  }

  return MIME_TO_EXTENSION[file.type] ?? ".bin";
}

export function getExtensionForMime(mime: string) {
  return MIME_TO_EXTENSION[mime] ?? ".bin";
}

export function buildVoiceNoteStoragePath(
  userId: string,
  canvasId: string,
  nodeId: string,
  mimeType: string,
) {
  const extension = getExtensionForMime(mimeType);

  return `${userId}/${canvasId}/${nodeId}/voice${extension}`;
}

/** Supabase object keys must not contain spaces or most punctuation in path segments. */
export function buildCanvasImageStoragePath(
  userId: string,
  canvasId: string,
  nodeId: string,
  file: File
) {
  const extension = getStorageFileExtension(file);

  return `${userId}/${canvasId}/${nodeId}/image${extension}`;
}
