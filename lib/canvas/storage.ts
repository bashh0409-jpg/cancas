import type { SupabaseClient } from "@supabase/supabase-js";
import * as tus from "tus-js-client";

const RESUMABLE_UPLOAD_BYTES = 6 * 1024 * 1024;
const TUS_CHUNK_BYTES = 6 * 1024 * 1024;

function getResumableUploadEndpoint() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  }

  const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

  if (projectRef) {
    return `https://${projectRef}.storage.supabase.co/storage/v1/upload/resumable`;
  }

  return `${supabaseUrl.replace(/\/$/, "")}/storage/v1/upload/resumable`;
}

async function uploadCanvasImageResumable(
  supabase: SupabaseClient,
  storagePath: string,
  file: File
) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("You must be signed in to upload files.");
  }

  const endpoint = getResumableUploadEndpoint();

  await new Promise<void>((resolve, reject) => {
    const upload = new tus.Upload(file, {
      endpoint,
      retryDelays: [0, 1000, 3000, 5000, 10000],
      headers: {
        authorization: `Bearer ${session.access_token}`,
        "x-upsert": "true",
      },
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      metadata: {
        bucketName: "canvas-files",
        objectName: storagePath,
        contentType: file.type || "application/octet-stream",
        cacheControl: "3600",
      },
      chunkSize: TUS_CHUNK_BYTES,
      onError: (error) => {
        reject(error);
      },
      onSuccess: () => {
        resolve();
      },
    });

    void upload
      .findPreviousUploads()
      .then((previousUploads) => {
        if (previousUploads.length > 0) {
          upload.resumeFromPreviousUpload(previousUploads[0]);
        }

        upload.start();
      })
      .catch(reject);
  });
}

export async function uploadCanvasImage(
  supabase: SupabaseClient,
  userId: string,
  canvasId: string,
  nodeId: string,
  file: File
): Promise<{ url: string; storagePath: string }> {
  const storagePath = `${userId}/${canvasId}/${nodeId}/${file.name}`;

  if (file.size > RESUMABLE_UPLOAD_BYTES) {
    await uploadCanvasImageResumable(supabase, storagePath, file);
  } else {
    const { error } = await supabase.storage.from("canvas-files").upload(storagePath, file, {
      upsert: true,
      contentType: file.type,
      cacheControl: "3600",
    });

    if (error) {
      throw error;
    }
  }

  const { data } = supabase.storage.from("canvas-files").getPublicUrl(storagePath);

  return {
    url: data.publicUrl,
    storagePath,
  };
}

export async function deleteCanvasImage(
  supabase: SupabaseClient,
  storagePath: string
) {
  const { error } = await supabase.storage
    .from("canvas-files")
    .remove([storagePath]);

  if (error) {
    throw error;
  }
}
