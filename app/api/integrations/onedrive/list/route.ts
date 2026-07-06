import { NextRequest, NextResponse } from "next/server";
import { getIntegrationToken } from "@/lib/integrations/store/store";

export const runtime = "nodejs";

function isImageName(name: string) {
  return /\.(png|jpe?g|gif|webp|avif|bmp|svg)$/i.test(name);
}

export async function GET(req: NextRequest) {
  try {
    const token = await getIntegrationToken("onedrive");

    if (!token) {
      return NextResponse.json(
        { error: "Not connected to OneDrive" },
        { status: 401 },
      );
    }

    const folderId =
      new URL(req.url).searchParams.get("folderId") ?? "root";

    // Microsoft Graph API — list children of a drive item
    // "root" means the user's OneDrive root; otherwise use the item ID
    const endpoint =
      folderId === "root"
        ? "https://graph.microsoft.com/v1.0/me/drive/root/children"
        : `https://graph.microsoft.com/v1.0/me/drive/items/${folderId}/children`;

    const response = await fetch(endpoint, {
      headers: {
        Authorization: `Bearer ${token.accessToken}`,
      },
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      return NextResponse.json(
        {
          error:
            payload?.error?.message || "Unable to load OneDrive folder contents.",
        },
        { status: response.status },
      );
    }

    const data = await response.json();
    const items = (data.value ?? []).map((item: {
      id: string;
      name: string;
      file?: { mimeType?: string };
      folder?: unknown;
      size?: number;
    }) => ({
      id: item.id,
      name: item.name,
      mimeType: item.file?.mimeType ?? "application/octet-stream",
      size: item.size ?? 0,
      isFolder: Boolean(item.folder),
      fileType: item.folder
        ? "folder"
        : (item.file?.mimeType ?? "").startsWith("image/") || isImageName(item.name)
          ? "image"
          : "file",
    }));

    return NextResponse.json({
      folder: {
        id: folderId,
        name: folderId === "root" ? "OneDrive" : folderId,
      },
      items,
    });
  } catch (err) {
    console.error("OneDrive list error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Unable to load OneDrive files.",
      },
      { status: 500 },
    );
  }
}