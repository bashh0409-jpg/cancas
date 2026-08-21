import { NextResponse } from "next/server";
import { deflateRawSync } from "node:zlib";
import { createClient, getAuthenticatedUser } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";

type ExportFile = {
  name: string;
  contents: Buffer;
};

function crc32(data: Uint8Array) {
  let crc = 0xffffffff;

  for (const byte of data) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function writeUInt16(value: number) {
  const buffer = Buffer.alloc(2);
  buffer.writeUInt16LE(value);
  return buffer;
}

function writeUInt32(value: number) {
  const buffer = Buffer.alloc(4);
  buffer.writeUInt32LE(value);
  return buffer;
}

function createZip(files: ExportFile[]) {
  const localFiles: Buffer[] = [];
  const centralDirectory: Buffer[] = [];
  let offset = 0;

  for (const file of files) {
    const name = Buffer.from(file.name, "utf8");
    const contents = file.contents;
    const compressed = deflateRawSync(contents);
    const checksum = crc32(contents);
    const localHeader = Buffer.concat([
      writeUInt32(0x04034b50),
      writeUInt16(20),
      writeUInt16(0),
      writeUInt16(8),
      writeUInt16(0),
      writeUInt16(0),
      writeUInt32(checksum),
      writeUInt32(compressed.length),
      writeUInt32(contents.length),
      writeUInt16(name.length),
      writeUInt16(0),
      name,
      compressed,
    ]);

    localFiles.push(localHeader);
    centralDirectory.push(
      Buffer.concat([
        writeUInt32(0x02014b50),
        writeUInt16(20),
        writeUInt16(20),
        writeUInt16(0),
        writeUInt16(8),
        writeUInt16(0),
        writeUInt16(0),
        writeUInt32(checksum),
        writeUInt32(compressed.length),
        writeUInt32(contents.length),
        writeUInt16(name.length),
        writeUInt16(0),
        writeUInt16(0),
        writeUInt16(0),
        writeUInt16(0),
        writeUInt32(0),
        writeUInt32(offset),
        name,
      ]),
    );

    offset += localHeader.length;
  }

  const directory = Buffer.concat(centralDirectory);
  return Buffer.concat([
    ...localFiles,
    directory,
    writeUInt32(0x06054b50),
    writeUInt16(0),
    writeUInt16(0),
    writeUInt16(files.length),
    writeUInt16(files.length),
    writeUInt32(directory.length),
    writeUInt32(offset),
    writeUInt16(0),
  ]);
}

function jsonFile(name: string, value: unknown): ExportFile {
  return {
    name,
    contents: Buffer.from(JSON.stringify(value, null, 2), "utf8"),
  };
}

function safeFileName(value: string, fallback: string) {
  const name = value
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);

  return name || fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function downloadMedia(
  supabase: ReturnType<typeof createServiceRoleClient>,
  bucket: string,
  storagePath: unknown,
  userId: string,
  canvasId: string,
) {
  if (
    typeof storagePath !== "string" ||
    !storagePath.startsWith(`${userId}/${canvasId}/`)
  ) {
    return null;
  }

  const { data, error } = await supabase.storage
    .from(bucket)
    .download(storagePath);

  if (error || !data) {
    console.warn("[Account Export] Unable to download media", {
      bucket,
      storagePath,
      error: error?.message,
    });
    return null;
  }

  return {
    bytes: Buffer.from(await data.arrayBuffer()),
    extension: storagePath.match(/\.[a-z0-9]{1,8}$/i)?.[0] ?? ".bin",
  };
}

function decodeDataUrl(value: unknown) {
  if (typeof value !== "string" || !value.startsWith("data:")) {
    return null;
  }

  const match = value.match(/^data:[^;]+;base64,([\s\S]+)$/);
  if (!match) return null;

  try {
    return Buffer.from(match[1], "base64");
  } catch {
    return null;
  }
}

async function exportCanvas(
  canvas: Record<string, unknown>,
  userId: string,
  supabase: ReturnType<typeof createServiceRoleClient>,
) {
  const canvasId = typeof canvas.id === "string" ? canvas.id : crypto.randomUUID();
  const canvasName = typeof canvas.name === "string" ? canvas.name : "Untitled";
  const folder = `${safeFileName(canvasName, "canvas")}-${canvasId}`;
  const content = isRecord(canvas.content) ? { ...canvas.content } : {};
  const files: ExportFile[] = [];

  const imageNodes = Array.isArray(content.imageNodes)
    ? content.imageNodes.map((node) => (isRecord(node) ? { ...node } : node))
    : [];
  for (const node of imageNodes) {
    if (!isRecord(node)) continue;

    const media = node.storagePath
      ? await downloadMedia(supabase, "canvas-files", node.storagePath, userId, canvasId)
      : decodeDataUrl(node.url);
    if (!media) {
      delete node.storagePath;
      continue;
    }

    const extension = "bytes" in media
      ? media.extension
      : node.fileName && typeof node.fileName === "string"
        ? node.fileName.match(/\.[a-z0-9]{1,8}$/i)?.[0] ?? ".bin"
        : ".bin";
    const fileName = safeFileName(
      typeof node.fileName === "string" ? node.fileName : `image-${node.id}`,
      `image-${node.id}${extension}`,
    );
    const archivePath = `${folder}/images/${fileName}`;
    files.push({
      name: archivePath,
      contents: "bytes" in media ? media.bytes : media,
    });
    node.url = `images/${fileName}`;
    delete node.storagePath;
  }
  content.imageNodes = imageNodes;

  const voiceNodes = Array.isArray(content.voiceNodes)
    ? content.voiceNodes.map((node) => (isRecord(node) ? { ...node } : node))
    : [];
  for (const node of voiceNodes) {
    if (!isRecord(node)) continue;

    const media = node.storagePath
      ? await downloadMedia(supabase, "voice-notes", node.storagePath, userId, canvasId)
      : decodeDataUrl(node.audioDataUrl);
    if (!media) {
      delete node.storagePath;
      delete node.audioDataUrl;
      continue;
    }

    const extension = "bytes" in media ? media.extension : ".webm";
    const fileName = safeFileName(
      typeof node.title === "string" ? node.title : `audio-${node.id}`,
      `audio-${node.id}${extension}`,
    );
    const archivePath = `${folder}/audio/${fileName}`;
    files.push({
      name: archivePath,
      contents: "bytes" in media ? media.bytes : media,
    });
    node.audioDataUrl = `audio/${fileName}`;
    delete node.storagePath;
  }
  content.voiceNodes = voiceNodes;

  files.unshift(
    jsonFile(`${folder}/canvas.json`, {
      id: canvas.id,
      slug: canvas.slug,
      name: canvas.name,
      created_at: canvas.created_at,
      updated_at: canvas.updated_at,
      content,
    }),
  );

  return files;
}

export async function GET() {
  try {
    const supabase = await createClient();
    const user = await getAuthenticatedUser(supabase);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminSupabase = createServiceRoleClient();
    const { data: canvases, error: canvasError } = await supabase
      .from("canvases")
      .select("id, slug, name, content, created_at, updated_at")
      .eq("user_id", user.id);

    if (canvasError) throw canvasError;

    const canvasFiles = (
      await Promise.all(
        (canvases ?? []).map((canvas) =>
          exportCanvas(canvas as Record<string, unknown>, user.id, adminSupabase),
        ),
      )
    ).flat();

    const files: ExportFile[] = [
      jsonFile("README.txt", {
        description: "Reflow canvas content export",
        contents: "Each canvas folder contains its canvas JSON, images, and audio files.",
        excluded: [
          "Authentication credentials and tokens",
          "Billing and subscription data",
          "Internal account metadata",
          "Integration credentials",
        ],
      }),
      ...canvasFiles,
    ];

    const archive = createZip(files);
    return new NextResponse(archive, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": 'attachment; filename="reflow-canvas-export.zip"',
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("[Account Export Error]", error);
    return NextResponse.json(
      { error: "Failed to export account data" },
      { status: 500 },
    );
  }
}