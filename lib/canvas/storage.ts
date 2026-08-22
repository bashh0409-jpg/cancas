import type { SupabaseClient } from "@supabase/supabase-js";
import { buildCanvasImageStoragePath } from "@/lib/canvas/storageKey";
import { buildVoiceNoteStoragePath } from "@/lib/canvas/storageKey";

export async function deleteVoiceNote(
  supabase: SupabaseClient,
  canvasId: string,
  storagePath: string,
) {
  if (storagePath.startsWith("r2/")) {
    const response = await fetch(
      `/api/canvases/${canvasId}/voice-upload?storagePath=${encodeURIComponent(storagePath)}`,
      { method: "DELETE" },
    );

    if (!response.ok) {
      throw new Error("Unable to delete R2 voice note");
    }

    return;
  }

  const { error } = await supabase.storage
    .from("voice-notes")
    .remove([storagePath]);

  if (error) throw error;
}

export async function getVoiceNoteUrl(canvasId: string, storagePath: string) {
  if (!storagePath.startsWith("r2/")) return null;

  const response = await fetch(
    `/api/canvases/${canvasId}/voice-upload?storagePath=${encodeURIComponent(storagePath)}`,
  );
  if (!response.ok) throw new Error("Unable to load R2 voice note");

  const body = (await response.json()) as { url?: unknown };
  return typeof body.url === "string" ? body.url : null;
}

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
): Promise<{ storagePath: string; url?: string }> {
  if (signal?.aborted) {
    throw new DOMException("Upload aborted", "AbortError");
  }

  const storagePath = buildVoiceNoteStoragePath(
    userId,
    canvasId,
    nodeId,
    (blob as File).type || "audio/webm",
  );

  const r2Response = await fetch(`/api/canvases/${canvasId}/voice-upload`, {
    method: "POST",
    headers: {
      "Content-Type": blob.type || "audio/webm",
      "X-Voice-Node-Id": nodeId,
    },
    body: blob,
  });

  if (r2Response.ok) {
    const body = (await r2Response.json()) as {
      storagePath: string;
      url: string;
    };
    return body;
  }

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
  canvasId: string,
  storagePath: string,
) {
  const response = await fetch(
    `/api/canvases/${canvasId}/upload-url?storagePath=${encodeURIComponent(storagePath)}`,
    { method: "DELETE" },
  );

  if (!response.ok) {
    throw new Error("Unable to delete canvas image");
  }
}
