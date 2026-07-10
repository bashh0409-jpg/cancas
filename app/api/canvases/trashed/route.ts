import { createClient, getAuthenticatedUser } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { listUserTrashedCanvases } from "@/lib/canvas/repository";

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await getAuthenticatedUser(supabase);

    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const canvases = await listUserTrashedCanvases(supabase, user.id);

    return NextResponse.json({ canvases });
  } catch (e) {
    return NextResponse.json(
      { error: "Unable to list trashed canvases" },
      { status: 500 },
    );
  }
}
