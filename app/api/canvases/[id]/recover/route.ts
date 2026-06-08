import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    const user = data.user;

    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { error } = await supabase
      .from("canvases")
      .update({ deleted_at: null })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error)
      return NextResponse.json(
        { error: "Unable to recover canvas" },
        { status: 500 },
      );

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: "Unable to recover canvas" },
      { status: 500 },
    );
  }
}
