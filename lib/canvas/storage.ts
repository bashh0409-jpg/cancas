import type { SupabaseClient } from "@supabase/supabase-js";
import { buildCanvasImageStoragePath } from "@/lib/canvas/storageKey";
import { buildVoiceNoteStoragePath } from "@/lib/canvas/storageKey";

export async function uploadCanvasImage(
  supabase: SupabaseClient,
  userId: string,
  canvasId: string,
  nodeId: string,
  file: File,
  signal?: AbortSignal,
): Promise<{ url: string; storagePath: string }> {
  if (signal?.aborted) {
    throw new DOMException("Upload aborted", "AbortError");
  }

  const storagePath = buildCanvasImageStoragePath(userId, canvasId, nodeId, file);

  const { error } = await supabase.storage.from("canvas-files").upload(
    storagePath,
    file,
    {
      upsert: true,
      contentType: file.type || "application/octet-stream",
      cacheControl: "3600",
    },
  );

  if (error) {
    throw error;
  }

  const { data } = supabase.storage.from("canvas-files").getPublicUrl(storagePath);

  return {
    url: data.publicUrl,
    storagePath,
  };
}

export async function uploadVoiceNote(
  supabase: SupabaseClient,
  userId: string,
  canvasId: string,
  nodeId: string,
  blob: Blob,
  signal?: AbortSignal,
): Promise<{ storagePath: string }> {
  if (signal?.aborted) {
    throw new DOMException("Upload aborted", "AbortError");
  }

  const storagePath = buildVoiceNoteStoragePath(
    userId,
    canvasId,
    nodeId,
    (blob as File).type || "audio/webm",
  );

  const { error } = await supabase.storage.from("voice-notes").upload(
    storagePath,
    blob as File,
    {
      upsert: true,
      contentType: (blob as File).type || "application/octet-stream",
      cacheControl: "3600",
    },
  );

  if (error) {
    throw error;
  }

  return { storagePath };
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
