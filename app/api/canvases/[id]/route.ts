import {
  deleteUserCanvas,
  moveUserCanvasToTrash,
  getUserCanvas,
  saveUserCanvasContent,
  updateUserCanvasName,
} from "@/lib/canvas/repository";
import { createClient, getAuthenticatedUser } from "@/lib/supabase/server";
import { parseCanvasContent } from "@/types/canvas";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const user = await getAuthenticatedUser(supabase);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const canvas = await getUserCanvas(supabase, user.id, id);

    if (!canvas) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({
      content: canvas.content,
      name: canvas.name,
      slug: canvas.slug,
      updated_at: canvas.updated_at,
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to load canvas" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const user = await getAuthenticatedUser(supabase);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const hasContent = body.content !== undefined && body.content !== null;
    const name = typeof body.name === "string" ? body.name.trim() : undefined;

    if (hasContent) {
      const content = parseCanvasContent(body.content);

      if (!content) {
        return NextResponse.json(
          { error: "Invalid canvas content" },
          { status: 400 },
        );
      }

      const updated = await saveUserCanvasContent(
        supabase,
        user.id,
        id,
        content,
        name,
      );

      return NextResponse.json({ ok: true, updated_at: updated.updated_at });
    } else if (name) {
      const updated = await updateUserCanvasName(supabase, user.id, id, name);

      return NextResponse.json({
        ok: true,
        slug: updated.slug,
        updated_at: updated.updated_at,
      });
    } else {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }
  } catch {
    return NextResponse.json(
      { error: "Unable to save canvas" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return PATCH(request, context);
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const user = await getAuthenticatedUser(supabase);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await moveUserCanvasToTrash(supabase, user.id, id);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Unable to delete canvas" },
      { status: 500 },
    );
  }
}
