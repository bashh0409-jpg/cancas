export type UploadDebugEntry = {
  id: string;
  at: string;
  nodeId: string;
  fileName: string;
  attempt: number;
  message: string;
};

export function isUploadDebugEnabled() {
  if (typeof window === "undefined" || process.env.NODE_ENV !== "development") {
    return false;
  }

  if (window.localStorage.getItem("canvasai:debug-uploads") === "1") {
    return true;
  }

  return new URLSearchParams(window.location.search).has("debugUploads");
}

export function formatUploadError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "object" && error !== null && "message" in error) {
    return String((error as { message: unknown }).message);
  }

  return String(error);
}

export function createUploadDebugEntry(
  nodeId: string,
  fileName: string,
  attempt: number,
  error: unknown
): UploadDebugEntry {
  return {
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    nodeId,
    fileName,
    attempt,
    message: formatUploadError(error),
  };
}

export function logUploadDebug(entry: UploadDebugEntry) {
  console.error(
    `[canvas upload] ${entry.fileName} (node ${entry.nodeId}) attempt ${entry.attempt}: ${entry.message}`
  );
}
