import { getUserCanvas } from "@/lib/canvas/repository";
import { deleteFromR2, isR2Configured, uploadToR2 } from "@/lib/r2";
import { buildR2VoiceNoteStoragePath } from "@/lib/canvas/storageKey";
import { createClient, getAuthenticatedUser } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    if (!isR2Configured()) {
      return NextResponse.json({ error: "R2 is not configured" }, { status: 503 });
    }

    const { id: canvasId } = await context.params;
    const supabase = await createClient();
    const user = await getAuthenticatedUser(supabase);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const canvas = await getUserCanvas(supabase, user.id, canvasId);
    if (!canvas) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const contentType = request.headers.get("content-type") || "audio/webm";
    if (!contentType.startsWith("audio/")) {
      return NextResponse.json({ error: "Invalid audio type" }, { status: 400 });
    }

    const body = new Uint8Array(await request.arrayBuffer());
    if (body.byteLength === 0 || body.byteLength > 50 * 1024 * 1024) {
      return NextResponse.json({ error: "Invalid audio size" }, { status: 400 });
    }

    const nodeId = request.headers.get("x-voice-node-id");
    if (!nodeId || !/^[a-zA-Z0-9-]{8,128}$/.test(nodeId)) {
      return NextResponse.json({ error: "Invalid voice note ID" }, { status: 400 });
    }

    const storagePath = buildR2VoiceNoteStoragePath(
      user.id,
      canvas.id,
      nodeId,
      contentType,
    );
    const url = await uploadToR2(storagePath, body, contentType);

    return NextResponse.json({ storagePath, url });
  } catch {
    return NextResponse.json({ error: "Unable to upload voice note" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    if (!isR2Configured()) {
      return NextResponse.json({ error: "R2 is not configured" }, { status: 503 });
    }

    const { id: canvasId } = await context.params;
    const supabase = await createClient();
    const user = await getAuthenticatedUser(supabase);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const canvas = await getUserCanvas(supabase, user.id, canvasId);
    if (!canvas) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const storagePath = new URL(request.url).searchParams.get("storagePath");
    const expectedPrefix = `r2/${user.id}/${canvas.id}/`;
    if (!storagePath?.startsWith(expectedPrefix)) {
      return NextResponse.json({ error: "Invalid storage path" }, { status: 400 });
    }

    await deleteFromR2(storagePath);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unable to delete voice note" }, { status: 500 });
  }
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    if (!isR2Configured()) {
      return NextResponse.json({ error: "R2 is not configured" }, { status: 503 });
    }

    const { id: canvasId } = await context.params;
    const supabase = await createClient();
    const user = await getAuthenticatedUser(supabase);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const canvas = await getUserCanvas(supabase, user.id, canvasId);
    if (!canvas) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const storagePath = new URL(request.url).searchParams.get("storagePath");
    if (!storagePath?.startsWith(`r2/${user.id}/${canvas.id}/`)) {
      return NextResponse.json({ error: "Invalid storage path" }, { status: 400 });
    }

    const publicUrl = process.env.R2_PUBLIC_URL?.replace(/\/$/, "");
    if (!publicUrl) return NextResponse.json({ error: "R2 is not configured" }, { status: 503 });

    return NextResponse.json({ url: `${publicUrl}/${storagePath}` });
  } catch {
    return NextResponse.json({ error: "Unable to load voice note" }, { status: 500 });
  }
}