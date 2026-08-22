import {
  getPendingUploadTicket,
  savePendingUploadTicket,
  deletePendingUploadTicket,
  type UploadTicket,
} from "@/lib/canvas/pendingUploads";

type ResumableImageUploadOptions = {
  canvasId: string;
  nodeId: string;
  file: File;
  onProgress: (percent: number) => void;
};

export function makeUploadFingerprint(
  canvasId: string,
  nodeId: string,
  file: File
): string {
  return `canvasai:${canvasId}:${nodeId}:${file.size}:${file.lastModified}`;
}

async function createUploadTicket(
  canvasId: string,
  nodeId: string,
  file: File
): Promise<UploadTicket> {
  const response = await fetch(`/api/canvases/${canvasId}/upload-url`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      nodeId,
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      fileSize: file.size,
    }),
  });

  const body = (await response.json().catch(() => null)) as
    | (Partial<UploadTicket> & { error?: unknown })
    | null;

  if (
    !response.ok ||
    !body ||
    typeof body.storagePath !== "string" ||
    typeof body.url !== "string" ||
    (typeof body.uploadUrl !== "string" &&
      (typeof body.token !== "string" || typeof body.endpoint !== "string"))
  ) {
    const message =
      body && typeof body.error === "string"
        ? body.error
        : "Unable to authorize image upload";
    throw new Error(message);
  }

  return {
    uploadUrl: body.uploadUrl,
    token: body.token,
    storagePath: body.storagePath,
    url: body.url,
    endpoint: body.endpoint,
  };
}

// Reuse the ticket for a given fingerprint across retries/resumes so the
// tus upload URL, storagePath, and x-signature stay consistent. Without
// this, every resume attempt mints a new token/storagePath and the old
// in-progress upload on the tus server becomes unreachable.
async function getOrCreateTicket(
  canvasId: string,
  nodeId: string,
  file: File,
  fingerprint: string
): Promise<{ ticket: UploadTicket; reusedCachedTicket: boolean }> {
  const cached = await getPendingUploadTicket(fingerprint);

  if (cached) {
    return { ticket: cached, reusedCachedTicket: true };
  }

  const ticket = await createUploadTicket(canvasId, nodeId, file);
  await savePendingUploadTicket(fingerprint, ticket);
  return { ticket, reusedCachedTicket: false };
}

function removeStoredTusUploads(fingerprint: string) {
  if (typeof window === "undefined") {
    return;
  }

  // tus-js-client's browser URL store keys uploads by fingerprint. Once a
  // resumed upload has failed, keeping this pointer makes the next fresh
  // ticket resume the same broken upload URL instead of starting over.
  const prefix = `tus::${fingerprint}::`;
  const keys = Array.from({ length: window.localStorage.length }, (_, index) =>
    window.localStorage.key(index),
  ).filter((key): key is string => key?.startsWith(prefix) ?? false);

  for (const key of keys) {
    window.localStorage.removeItem(key);
  }
}

export async function uploadCanvasImageResumable({
  canvasId,
  nodeId,
  file,
  onProgress,
}: ResumableImageUploadOptions): Promise<{
  storagePath: string;
  url: string;
}> {
  const fingerprint = makeUploadFingerprint(canvasId, nodeId, file);
  const { ticket, reusedCachedTicket } = await getOrCreateTicket(
    canvasId,
    nodeId,
    file,
    fingerprint,
  );

  try {
    if (ticket.uploadUrl) {
      await uploadWithProgress(ticket.uploadUrl, file, onProgress);
      await deletePendingUploadTicket(fingerprint).catch(() => {});
      return { storagePath: ticket.storagePath, url: ticket.url };
    }

    if (!ticket.token || !ticket.endpoint) {
      throw new Error("Invalid image upload ticket");
    }

    const tusToken = ticket.token;
    const tusEndpoint = ticket.endpoint;

    const tus = await import("tus-js-client");
    await new Promise<void>((resolve, reject) => {
      const upload = new tus.Upload(file, {
        endpoint: tusEndpoint,
        chunkSize: 6 * 1024 * 1024,
        retryDelays: [0, 3_000, 5_000, 10_000, 20_000],
        removeFingerprintOnSuccess: true,
        uploadDataDuringCreation: true,
        headers: {
          "x-signature": tusToken,
          "x-upsert": "true",
        },
        metadata: {
          bucketName: "canvas-files",
          objectName: ticket.storagePath,
          contentType: file.type || "application/octet-stream",
          cacheControl: "3600",
        },
        fingerprint: async () => fingerprint,
        onProgress: (bytesSent, bytesTotal) => {
          const percent = bytesTotal > 0 ? (bytesSent / bytesTotal) * 100 : 0;
          onProgress(Math.min(99, Math.max(0, Math.floor(percent))));
        },
        onSuccess: () => resolve(),
        onError: (error) => reject(error),
      });

      void upload
        .findPreviousUploads()
        .then((previousUploads) => {
          if (previousUploads.length > 0) {
            upload.resumeFromPreviousUpload(previousUploads[0]);
          }
          upload.start();
        })
        .catch(() => {
          upload.start();
        });
    });
  } catch (error) {
    if (reusedCachedTicket) {
      // A saved ticket/upload URL can no longer be usable after the tab has
      // been suspended or closed. Clear both so the workspace's next retry
      // authorizes a brand-new resumable upload for the persisted file.
      await deletePendingUploadTicket(fingerprint).catch(() => {});
      removeStoredTusUploads(fingerprint);
    }

    throw error;
  }

  // Upload succeeded — the ticket is spent, drop it so a future re-upload
  // of the same file (e.g. delete + re-add) mints a fresh one instead of
  // reusing a completed/expired token.
  await deletePendingUploadTicket(fingerprint).catch(() => {
    // Best-effort cleanup; a stale cached ticket is harmless since
    // getOrCreateTicket only reads it, never assumes validity server-side.
  });

  return { storagePath: ticket.storagePath, url: ticket.url };
}

function uploadWithProgress(
  uploadUrl: string,
  file: File,
  onProgress: (percent: number) => void,
) {
  return new Promise<void>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("PUT", uploadUrl);
    request.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    request.setRequestHeader("Cache-Control", "public, max-age=86400");
    request.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      onProgress(Math.min(99, Math.floor((event.loaded / event.total) * 100)));
    };
    request.onload = () => {
      if (request.status >= 200 && request.status < 300) {
        onProgress(100);
        resolve();
      } else {
        reject(new Error(`R2 upload failed with status ${request.status}`));
      }
    };
    request.onerror = () => reject(new Error("R2 upload failed"));
    request.onabort = () => reject(new DOMException("Upload aborted", "AbortError"));
    request.send(file);
  });
}
