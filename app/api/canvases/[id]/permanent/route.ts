import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { deleteUserCanvas } from "@/lib/canvas/repository";

export async function DELETE(
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

    await deleteUserCanvas(supabase, user.id, id);

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: "Unable to permanently delete canvas" },
      { status: 500 },
    );
  }
}
