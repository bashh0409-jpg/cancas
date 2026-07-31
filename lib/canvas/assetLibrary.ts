import { createClient } from "@/lib/supabase/client";
import { getStorageFileExtension } from "@/lib/canvas/storageKey";

export type LibraryAsset = {
  id: string;
  user_id: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  file_type: "image" | "document" | "spreadsheet" | "text" | "unknown";
  storage_path: string;
  public_url: string;
  thumbnail_url: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

/**
 * Detect the file type based on MIME type and extension.
 */
export function detectFileType(mimeType: string, fileName: string): LibraryAsset["file_type"] {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("text/")) return "text";
  if (
    mimeType.includes("spreadsheet") ||
    mimeType.includes("excel") ||
    fileName.endsWith(".csv") ||
    fileName.endsWith(".xlsx") ||
    fileName.endsWith(".xls")
  )
    return "spreadsheet";
  if (
    mimeType.includes("document") ||
    mimeType.includes("pdf") ||
    fileName.endsWith(".docx") ||
    fileName.endsWith(".doc") ||
    fileName.endsWith(".pdf")
  )
    return "document";
  return "unknown";
}

/**
 * Build a storage path for a library asset.
 * Format: library/{userId}/{assetId}/{file}
 */
export function buildLibraryStoragePath(
  userId: string,
  assetId: string,
  file: File
): string {
  const extension = getStorageFileExtension(file);
  return `library/${userId}/${assetId}/asset${extension}`;
}

/**
 * Fetch all library assets for the current user.
 */
export async function fetchLibraryAssets(): Promise<LibraryAsset[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("asset_library")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch library assets:", error.message);
    throw new Error(error.message);
  }

  return data ?? [];
}

/**
 * Upload a file to the library (storage + database record).
 * Returns the created library asset record.
 */
export async function uploadToLibrary(file: File): Promise<LibraryAsset> {
  const supabase = createClient();

  // Get current user
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) {
    throw new Error("You must be signed in to use the library.");
  }

  const userId = userData.user.id;
  const assetId = crypto.randomUUID();
  const storagePath = buildLibraryStoragePath(userId, assetId, file);

  // Upload the file to storage
  const { error: uploadError } = await supabase.storage
    .from("canvas-files")
    .upload(storagePath, file, {
      upsert: false,
      contentType: file.type || "application/octet-stream",
      cacheControl: "3600",
    });

  if (uploadError) {
    console.error("Failed to upload to library storage:", uploadError.message);
    throw new Error(uploadError.message);
  }

  // Get the public URL
  const { data: urlData } = supabase.storage
    .from("canvas-files")
    .getPublicUrl(storagePath);

  const publicUrl = urlData.publicUrl;

  // Generate thumbnail for images (use the public URL as the thumbnail)
  let thumbnailUrl: string | null = null;
  if (file.type.startsWith("image/")) {
    thumbnailUrl = publicUrl;
  }

  // Create the database record
  const fileType = detectFileType(file.type, file.name);
  const { data, error: dbError } = await supabase
    .from("asset_library")
    .insert({
      id: assetId,
      user_id: userId,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type || "application/octet-stream",
      file_type: fileType,
      storage_path: storagePath,
      public_url: publicUrl,
      thumbnail_url: thumbnailUrl,
      metadata: {},
    })
    .select()
    .single();

  if (dbError) {
    // Clean up the storage file if the DB insert fails
    await supabase.storage.from("canvas-files").remove([storagePath]).catch(() => {});
    console.error("Failed to create library record:", dbError.message);
    throw new Error(dbError.message);
  }

  return data;
}

/**
 * Delete a library asset (storage + database record).
 */
export async function deleteLibraryAsset(assetId: string): Promise<void> {
  const supabase = createClient();

  // Get the asset record first to get the storage path
  const { data: asset, error: fetchError } = await supabase
    .from("asset_library")
    .select("storage_path")
    .eq("id", assetId)
    .single();

  if (fetchError) {
    console.error("Failed to fetch library asset:", fetchError.message);
    throw new Error(fetchError.message);
  }

  // Delete from storage
  if (asset?.storage_path) {
    const { error: storageError } = await supabase.storage
      .from("canvas-files")
      .remove([asset.storage_path]);

    if (storageError) {
      console.error("Failed to delete library storage file:", storageError.message);
      // Continue with DB deletion even if storage fails
    }
  }

  // Delete the database record
  const { error: dbError } = await supabase
    .from("asset_library")
    .delete()
    .eq("id", assetId);

  if (dbError) {
    console.error("Failed to delete library record:", dbError.message);
    throw new Error(dbError.message);
  }
}