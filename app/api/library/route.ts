import { createClient, getAuthenticatedUser } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/library
 * List all library assets for the current user.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const user = await getAuthenticatedUser(supabase);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("asset_library")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch library assets:", error.message);
      return NextResponse.json(
        { error: "Unable to load library assets" },
        { status: 500 },
      );
    }

    return NextResponse.json({ assets: data ?? [] });
  } catch (err) {
    console.error("Unexpected error fetching library assets:", err);
    return NextResponse.json(
      { error: "Unable to load library assets" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/library
 * Upload a file to the library. Accepts multipart/form-data with a "file" field.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await getAuthenticatedUser(supabase);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No file provided. Send a file as 'file' in form-data." },
        { status: 400 },
      );
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File exceeds 50MB limit." },
        { status: 400 },
      );
    }

    // Generate a unique ID for the asset
    const assetId = crypto.randomUUID();

    // Build storage path: library/{userId}/{assetId}/{file}
    const extension = file.name.match(/(\.[a-z0-9]{1,8})$/i)?.[1]?.toLowerCase() ?? ".bin";
    const storagePath = `library/${user.id}/${assetId}/asset${extension}`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from("canvas-files")
      .upload(storagePath, file, {
        upsert: false,
        contentType: file.type || "application/octet-stream",
        cacheControl: "3600",
      });

    if (uploadError) {
      console.error("Failed to upload to storage:", uploadError.message);
      return NextResponse.json(
        { error: "Failed to upload file to storage." },
        { status: 500 },
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("canvas-files")
      .getPublicUrl(storagePath);

    const publicUrl = urlData.publicUrl;

    // Detect file type
    const fileType = detectFileType(file.type, file.name);

    // Generate thumbnail for images
    let thumbnailUrl: string | null = null;
    if (file.type.startsWith("image/")) {
      thumbnailUrl = publicUrl;
    }

    // Create database record
    const { data, error: dbError } = await supabase
      .from("asset_library")
      .insert({
        id: assetId,
        user_id: user.id,
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
      // Clean up storage on DB failure
      await supabase.storage
        .from("canvas-files")
        .remove([storagePath])
        .catch(() => {});

      console.error("Failed to create library record:", dbError.message);
      return NextResponse.json(
        { error: "Failed to save library record." },
        { status: 500 },
      );
    }

    return NextResponse.json({ asset: data }, { status: 201 });
  } catch (err) {
    console.error("Unexpected error uploading to library:", err);
    return NextResponse.json(
      { error: "Unable to upload file to library." },
      { status: 500 },
    );
  }
}

// Helper function (duplicated from lib/canvas/assetLibrary.ts to avoid server-side import issues)
function detectFileType(
  mimeType: string,
  fileName: string,
): "image" | "document" | "spreadsheet" | "text" | "unknown" {
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