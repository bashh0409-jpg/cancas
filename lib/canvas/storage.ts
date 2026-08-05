import type { SupabaseClient } from "@supabase/supabase-js";
import { buildCanvasImageStoragePath } from "@/lib/canvas/storageKey";
import { buildVoiceNoteStoragePath } from "@/lib/canvas/storageKey";

export async function uploadCanvasImage(
  supabase: SupabaseClient,
  userId: string,
  canvasId: string,
  nodeId: string,
  file: File
): Promise<{ url: string; storagePath: string }> {
  const storagePath = buildCanvasImageStoragePath(userId, canvasId, nodeId, file);

  const { error } = await supabase.storage.from("canvas-files").upload(storagePath, file, {
    upsert: true,
    contentType: file.type || "application/octet-stream",
    cacheControl: "3600",
  });

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
): Promise<{ url: string; storagePath: string }> {
  const storagePath = buildVoiceNoteStoragePath(
    userId,
    canvasId,
    nodeId,
    (blob as File).type || "audio/webm",
  );

  // Supabase upload expects a File or Blob; pass the blob directly.
  const { error } = await supabase.storage.from("voice-notes").upload(storagePath, blob as File, {
    upsert: true,
    contentType: (blob as File).type || "application/octet-stream",
    cacheControl: "3600",
  });

  if (error) {
    throw error;
  }

  // Create a signed URL for playback (1 hour)
  const { data } = await supabase.storage
    .from("voice-notes")
    .createSignedUrl(storagePath, 60 * 60);

  const url = data?.signedUrl ?? "";

  return { url, storagePath };
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
