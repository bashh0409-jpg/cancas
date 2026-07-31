import { createClient, getAuthenticatedUser } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * DELETE /api/library/[id]
 * Remove an asset from the library (storage + database record).
 */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const user = await getAuthenticatedUser(supabase);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch the asset to verify ownership and get storage path
    const { data: asset, error: fetchError } = await supabase
      .from("asset_library")
      .select("storage_path, user_id")
      .eq("id", id)
      .single();

    if (fetchError || !asset) {
      return NextResponse.json(
        { error: "Asset not found" },
        { status: 404 },
      );
    }

    // Verify ownership
    if (asset.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Delete from storage (best-effort)
    if (asset.storage_path) {
      await supabase.storage
        .from("canvas-files")
        .remove([asset.storage_path])
        .catch(() => {
          // Storage deletion is best-effort; the DB record is the source of truth
        });
    }

    // Delete the database record
    const { error: dbError } = await supabase
      .from("asset_library")
      .delete()
      .eq("id", id);

    if (dbError) {
      console.error("Failed to delete library asset:", dbError.message);
      return NextResponse.json(
        { error: "Unable to delete library asset" },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Unexpected error deleting library asset:", err);
    return NextResponse.json(
      { error: "Unable to delete library asset" },
      { status: 500 },
    );
  }
}