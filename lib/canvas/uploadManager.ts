// uploadManager.ts
import * as tus from "tus-js-client";
import { get as idbGet, set as idbSet, del as idbDel, keys as idbKeys } from "idb-keyval";

type UploadTicket = {
  token: string;
  storagePath: string;
  url: string;
  endpoint: string;
};

type ResumableImageUploadOptions = {
  canvasId: string;
  nodeId: string;
  file: File;
  onProgress: (percent: number) => void;
  onComplete?: (result: { storagePath: string; url: string }) => void;
  onFailure?: (error: unknown) => void;
};

const FP_PREFIX = "canvasai";

function makeFingerprint(canvasId: string, nodeId: string, file: File): string {
  return `${FP_PREFIX}:${canvasId}:${nodeId}:${file.size}:${file.lastModified}`;
}

// ---- Ticket creation (backend call) ----

async function createUploadTicket(
  canvasId: string,
  nodeId: string,
  file: File,
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
    typeof body.token !== "string" ||
    typeof body.storagePath !== "string" ||
    typeof body.url !== "string" ||
    typeof body.endpoint !== "string"
  ) {
    const message =
      body && typeof body.error === "string"
        ? body.error
        : "Unable to authorize image upload";
    throw new Error(message);
  }

  return {
    token: body.token,
    storagePath: body.storagePath,
    url: body.url,
    endpoint: body.endpoint,
  };
}

// ---- IndexedDB-backed ticket cache, so a resume reuses the SAME ticket ----
// (important if your backend signature/token is single-use — resuming with
// a freshly minted token can be rejected by the tus endpoint)

const ticketKey = (fingerprint: string) => `ticket:${fingerprint}`;

async function getOrCreateTicket(
  canvasId: string,
  nodeId: string,
  file: File,
  fingerprint: string,
): Promise<UploadTicket> {
  const cached = await idbGet<UploadTicket>(ticketKey(fingerprint));
  if (cached) return cached;

  const ticket = await createUploadTicket(canvasId, nodeId, file);
  await idbSet(ticketKey(fingerprint), ticket);
  return ticket;
}

// ---- File byte persistence, so uploads survive full reload/tab close ----

const fileKey = (fingerprint: string) => `file:${fingerprint}`;

async function persistFile(fingerprint: string, file: File): Promise<void> {
  await idbSet(fileKey(fingerprint), file);
}

async function retrieveFile(fingerprint: string): Promise<File | undefined> {
  return idbGet<File>(fileKey(fingerprint));
}

async function clearPersistedUpload(fingerprint: string): Promise<void> {
  await Promise.all([idbDel(fileKey(fingerprint)), idbDel(ticketKey(fingerprint))]);
}

// ---- Singleton registry so route/component unmounts don't abort uploads ----

const activeUploads = new Map<string, tus.Upload>();

function isUploadActive(fingerprint: string): boolean {
  return activeUploads.has(fingerprint);
}

// ---- Core resumable upload ----

async function runResumableUpload(
  opts: ResumableImageUploadOptions,
): Promise<{ storagePath: string; url: string }> {
  const { canvasId, nodeId, file, onProgress, onComplete, onFailure } = opts;
  const fingerprint = makeFingerprint(canvasId, nodeId, file);

  if (isUploadActive(fingerprint)) {
    throw new Error(`Upload already in progress for ${fingerprint}`);
  }

  // Persist bytes immediately so a reload mid-upload has something to resume with
  await persistFile(fingerprint, file);

  const ticket = await getOrCreateTicket(canvasId, nodeId, file, fingerprint);

  const result = await new Promise<{ storagePath: string; url: string }>(
    (resolve, reject) => {
      const upload = new tus.Upload(file, {
        endpoint: ticket.endpoint,
        chunkSize: 6 * 1024 * 1024,
        retryDelays: [0, 3_000, 5_000, 10_000, 20_000],
        removeFingerprintOnSuccess: true,
        uploadDataDuringCreation: true,
        headers: {
          "x-signature": ticket.token,
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
        onSuccess: () => {
          onProgress(100);
          resolve({ storagePath: ticket.storagePath, url: ticket.url });
        },
        onError: (error) => reject(error),
      });

      activeUploads.set(fingerprint, upload);

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
    },
  ).finally(() => {
    activeUploads.delete(fingerprint);
  });

  await clearPersistedUpload(fingerprint);
  onComplete?.(result);
  return result;
}

/**
 * Public entry point: call this whenever the user picks/drops a new file.
 * Safe to call even if navigation later unmounts the calling component —
 * the upload keeps running via the module-level `activeUploads` registry.
 */
export function startManagedUpload(opts: ResumableImageUploadOptions): void {
  const fingerprint = makeFingerprint(opts.canvasId, opts.nodeId, opts.file);
  if (isUploadActive(fingerprint)) return; // already running, don't double-start

  void runResumableUpload(opts).catch((error) => {
    opts.onFailure?.(error);
  });
}

// ---- Orphan detection + auto-resume on mount/reload ----

type OrphanedUpload = {
  fingerprint: string;
  canvasId: string;
  nodeId: string;
};

function parseFingerprint(fingerprint: string): OrphanedUpload | null {
  const parts = fingerprint.split(":");
  if (parts.length < 5 || parts[0] !== FP_PREFIX) return null;
  const [, canvasId, nodeId] = parts;
  return { fingerprint, canvasId, nodeId };
}

/**
 * Scans tus's localStorage pointers for unfinished uploads belonging to this
 * canvas, and — for any where we still have the file bytes in IndexedDB —
 * automatically resumes them. Returns fingerprints that couldn't be resumed
 * (bytes lost, e.g. different browser/profile) so you can prompt the user
 * to reselect those files.
 */
export async function resumeOrphanedUploads(
  canvasId: string,
  callbacks: {
    onProgress: (nodeId: string, percent: number) => void;
    onComplete?: (nodeId: string, result: { storagePath: string; url: string }) => void;
    onFailure?: (nodeId: string, error: unknown) => void;
  },
): Promise<{ resumed: string[]; lost: string[] }> {
  const resumed: string[] = [];
  const lost: string[] = [];

  const tusKeys = Object.keys(localStorage).filter((k) =>
    k.startsWith(`tus::${FP_PREFIX}:${canvasId}:`),
  );

  for (const storageKey of tusKeys) {
    // tus stores keys like "tus::<fingerprint>::upload"
    const middle = storageKey.split("::")[1];
    if (!middle) continue;

    const parsed = parseFingerprint(middle);
    if (!parsed) continue;

    const file = await retrieveFile(parsed.fingerprint);

    if (!file) {
      lost.push(parsed.nodeId);
      continue;
    }

    resumed.push(parsed.nodeId);
    startManagedUpload({
      canvasId: parsed.canvasId,
      nodeId: parsed.nodeId,
      file,
      onProgress: (percent) => callbacks.onProgress(parsed.nodeId, percent),
      onComplete: (result) => callbacks.onComplete?.(parsed.nodeId, result),
      onFailure: (error) => callbacks.onFailure?.(parsed.nodeId, error),
    });
  }

  return { resumed, lost };
}