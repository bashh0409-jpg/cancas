import { createClient, getAuthenticatedUser } from "@/lib/supabase/server";
import { getUserCanvasesByIds } from "@/lib/canvas/repository";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await getAuthenticatedUser(supabase);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ids = request.nextUrl.searchParams.get("ids") ?? "";
    const canvasIds = ids
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);

    if (canvasIds.length === 0) {
      return NextResponse.json({ canvases: [] });
    }

    const canvases = await getUserCanvasesByIds(supabase, user.id, canvasIds);

    return NextResponse.json({ canvases });
  } catch {
    return NextResponse.json(
      { error: "Unable to load library content" },
      { status: 500 },
    );
  }
}
