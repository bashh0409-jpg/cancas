import { NextRequest, NextResponse } from "next/server";
import { getIntegrationToken } from "@/lib/integrations/store/store";

function isImageName(name: string) {
  return /\.(png|jpe?g|gif|webp|avif|bmp|svg)$/i.test(name);
}

export async function GET(req: NextRequest) {
  try {
    const token = await getIntegrationToken("dropbox");

    if (!token) {
      return NextResponse.json(
        { error: "Not connected to Dropbox" },
        { status: 401 },
      );
    }

    const path = new URL(req.url).searchParams.get("path") ?? "";
    const response = await fetch(
      "https://api.dropboxapi.com/2/files/list_folder",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          path,
          recursive: false,
          include_media_info: false,
          include_deleted: false,
          include_has_explicit_shared_members: false,
          include_mounted_folders: true,
          include_non_downloadable_files: false,
        }),
      },
    );

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      return NextResponse.json(
        {
          error:
            payload?.error_summary || "Unable to load Dropbox folder contents.",
        },
        { status: response.status },
      );
    }

    type DropboxEntry = {
      id: string;
      name: string;
      size?: number;
      path_lower?: string;
      path_display?: string;
      [".tag"]: "file" | "folder";
    };

    const data = await response.json();
    const items = (data.entries ?? []).map((entry: DropboxEntry) => {
      const isImage = entry[".tag"] !== "folder" && isImageName(entry.name);
      return {
        id: entry.id,
        name: entry.name,
        mimeType: entry[".tag"] === "folder" ? "" : "application/octet-stream",
        size: entry.size ?? 0,
        isFolder: entry[".tag"] === "folder",
        fileType:
          entry[".tag"] === "folder" ? "folder" : isImage ? "image" : "file",
        path: entry.path_lower ?? entry.path_display,
        thumbnailUrl: isImage
          ? `/api/integrations/dropbox/thumbnail?path=${encodeURIComponent(
              entry.path_lower ?? entry.path_display ?? entry.name,
            )}`
          : undefined,
      };
    });

    return NextResponse.json({
      folder: { id: path || "", name: path === "" ? "Dropbox" : path },
      items,
    });
  } catch (err) {
    console.error("Dropbox list error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Unable to load Dropbox folder contents.",
      },
      { status: 500 },
    );
  }
}
