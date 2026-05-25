import type { SupabaseClient } from "@supabase/supabase-js";

export async function uploadCanvasImage(
  supabase: SupabaseClient,
  userId: string,
  canvasId: string,
  nodeId: string,
  file: File
): Promise<{ url: string; storagePath: string }> {
  const storagePath = `${userId}/${canvasId}/${nodeId}/${file.name}`;

  const { error } = await supabase.storage.from("canvas-files").upload(storagePath, file, {
    upsert: true,
    contentType: file.type,
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
