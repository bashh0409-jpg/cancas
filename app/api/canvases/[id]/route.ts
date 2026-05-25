import { saveUserCanvasContent } from "@/lib/canvas/repository";
import { createClient } from "@/lib/supabase/server";
import { parseCanvasContent } from "@/types/canvas";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    const user = data.user;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const content = parseCanvasContent(body.content);

    if (!content) {
      return NextResponse.json({ error: "Invalid canvas content" }, { status: 400 });
    }

    const name = typeof body.name === "string" ? body.name : undefined;

    await saveUserCanvasContent(supabase, user.id, id, content, name);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Unable to save canvas" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return PATCH(request, context);
}
