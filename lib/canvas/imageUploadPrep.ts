const MAX_UPLOAD_EDGE_PX = 2048;
const WEBP_QUALITY = 0.82;
const SKIP_PREP_MAX_BYTES = 400_000;
const SKIP_PREP_IF_WEBP_MAX_BYTES = 900_000;

const SKIP_PREP_TYPES = new Set(["image/gif", "image/svg+xml"]);

function replaceExtension(fileName: string, extension: string) {
  const base = fileName.replace(/\.[^.]+$/, "");

  return `${base}.${extension}`;
}

export async function prepareImageForUpload(file: File): Promise<File> {
  if (SKIP_PREP_TYPES.has(file.type)) {
    return file;
  }

  if (
    file.size <= SKIP_PREP_MAX_BYTES ||
    (file.type === "image/webp" && file.size <= SKIP_PREP_IF_WEBP_MAX_BYTES)
  ) {
    return file;
  }

  let bitmap: ImageBitmap | null = null;

  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file;
  }

  const longestEdge = Math.max(bitmap.width, bitmap.height);
  const scale = Math.min(1, MAX_UPLOAD_EDGE_PX / longestEdge);

  if (scale === 1 && file.size <= SKIP_PREP_IF_WEBP_MAX_BYTES) {
    bitmap.close();
    return file;
  }

  const targetWidth = Math.max(1, Math.round(bitmap.width * scale));
  const targetHeight = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");

  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const context = canvas.getContext("2d");

  if (!context) {
    bitmap.close();
    return file;
  }

  context.drawImage(bitmap, 0, 0, targetWidth, targetHeight);
  bitmap.close();

  const outputType = "image/webp";
  const preparedBlob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, outputType, WEBP_QUALITY);
  });

  if (!preparedBlob || preparedBlob.size >= file.size) {
    return file;
  }

  return new File([preparedBlob], replaceExtension(file.name, "webp"), {
    type: outputType,
    lastModified: file.lastModified,
  });
}

export async function runWithConcurrency<T>(
  items: readonly T[],
  limit: number,
  worker: (item: T) => Promise<void>
) {
  if (items.length === 0) {
    return;
  }

  const queue = [...items];
  const workerCount = Math.min(Math.max(1, limit), queue.length);

  await Promise.all(
    Array.from({ length: workerCount }, async () => {
      while (queue.length > 0) {
        const item = queue.shift();

        if (!item) {
          return;
        }

        await worker(item);
      }
    })
  );
}
