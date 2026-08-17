import * as tus from "tus-js-client";

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
};

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
    | Partial<UploadTicket> & { error?: unknown }
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

export async function uploadCanvasImageResumable({
  canvasId,
  nodeId,
  file,
  onProgress,
}: ResumableImageUploadOptions): Promise<{
  storagePath: string;
  url: string;
}> {
  const ticket = await createUploadTicket(canvasId, nodeId, file);

  await new Promise<void>((resolve, reject) => {
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
      fingerprint: async (uploadFile) =>
        `canvasai:${canvasId}:${nodeId}:${uploadFile.size}:${uploadFile.lastModified}`,
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

  return { storagePath: ticket.storagePath, url: ticket.url };
}
