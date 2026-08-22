import { getUserCanvas } from "@/lib/canvas/repository";
import { createR2UploadUrl, deleteFromR2, isR2Configured } from "@/lib/r2";
import { buildCanvasImageStoragePath } from "@/lib/canvas/storageKey";
import { createClient, getAuthenticatedUser } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type UploadRequest = {
  nodeId?: unknown;
  fileName?: unknown;
  mimeType?: unknown;
  fileSize?: unknown;
};

function getMaxUploadBytes() {
  const configuredMegabytes = Number(process.env.NEXT_PUBLIC_MAX_FILE_SIZE_MB);
  const megabytes = Number.isFinite(configuredMegabytes)
    ? configuredMegabytes
    : 50;

  return megabytes * 1024 * 1024;
}

function getResumableUploadEndpoint() {
  const supabaseUrl = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!);

  if (supabaseUrl.hostname.endsWith(".supabase.co")) {
    supabaseUrl.hostname = supabaseUrl.hostname.replace(
      ".supabase.co",
      ".storage.supabase.co",
    );
  }

  // The signed-upload-token flow (x-signature header) is only recognized by
  // Supabase Storage's TUS server on the `/sign` sub-route. Posting to the
  // plain `/storage/v1/upload/resumable` endpoint falls through to standard
  // JWT auth, which fails with "Invalid Compact JWS" since no Authorization
  // bearer token is sent — see the resumable-upload-signed-uppy example in
  // supabase/supabase, which uses this same `/sign` suffixed endpoint.
  supabaseUrl.pathname = "/storage/v1/upload/resumable/sign";
  supabaseUrl.search = "";
  supabaseUrl.hash = "";

  return supabaseUrl.toString();
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id: canvasId } = await context.params;
    const supabase = await createClient();
    const user = await getAuthenticatedUser(supabase);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const canvas = await getUserCanvas(supabase, user.id, canvasId);

    if (!canvas) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = (await request.json()) as UploadRequest;
    const { nodeId, fileName, mimeType, fileSize } = body;

    if (
      typeof nodeId !== "string" ||
      !/^[a-zA-Z0-9-]{8,128}$/.test(nodeId) ||
      typeof fileName !== "string" ||
      !fileName.trim() ||
      typeof mimeType !== "string" ||
      !mimeType.startsWith("image/") ||
      typeof fileSize !== "number" ||
      !Number.isFinite(fileSize) ||
      fileSize <= 0 ||
      fileSize > getMaxUploadBytes()
    ) {
      return NextResponse.json({ error: "Invalid image upload request" }, { status: 400 });
    }

    const file = new File([], fileName, { type: mimeType });
    const storagePath = buildCanvasImageStoragePath(
      user.id,
      canvas.id,
      nodeId,
      file,
    );

    if (isR2Configured()) {
      const { uploadUrl, publicUrl } = await createR2UploadUrl(
        storagePath,
        mimeType,
      );

      return NextResponse.json({
        uploadUrl,
        storagePath,
        url: publicUrl,
      });
    }

    const { data, error } = await supabase.storage
      .from("canvas-files")
      .createSignedUploadUrl(storagePath, { upsert: true });

    if (error || !data) {
      return NextResponse.json(
        { error: "Unable to authorize image upload" },
        { status: 502 },
      );
    }

    const { data: publicUrlData } = supabase.storage
      .from("canvas-files")
      .getPublicUrl(storagePath);

    return NextResponse.json({
      token: data.token,
      storagePath,
      url: publicUrlData.publicUrl,
      endpoint: getResumableUploadEndpoint(),
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to authorize image upload" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id: canvasId } = await context.params;
    const supabase = await createClient();
    const user = await getAuthenticatedUser(supabase);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const canvas = await getUserCanvas(supabase, user.id, canvasId);

    if (!canvas) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const storagePath = new URL(request.url).searchParams.get("storagePath");
    const expectedPrefix = `${user.id}/${canvas.id}/`;

    if (!storagePath?.startsWith(expectedPrefix)) {
      return NextResponse.json({ error: "Invalid storage path" }, { status: 400 });
    }

    const deletionErrors: unknown[] = [];

    if (isR2Configured()) {
      try {
        await deleteFromR2(storagePath);
      } catch (error) {
        deletionErrors.push(error);
      }
    }

    const { error } = await supabase.storage
      .from("canvas-files")
      .remove([storagePath]);

    if (error) {
      deletionErrors.push(error);
    }

    if (deletionErrors.length > 0) {
      return NextResponse.json(
        { error: "Unable to delete canvas image" },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Unable to delete canvas image" },
      { status: 500 },
    );
  }
}
