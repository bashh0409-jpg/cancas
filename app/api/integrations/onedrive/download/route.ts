import { NextRequest, NextResponse } from "next/server";
import { getIntegrationToken } from "@/lib/integrations/store/store";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const token = await getIntegrationToken("onedrive");

    if (!token) {
      return NextResponse.json(
        { error: "Not connected to OneDrive" },
        { status: 401 },
      );
    }

    const fileId = new URL(req.url).searchParams.get("fileId");

    if (!fileId) {
      return NextResponse.json({ error: "Missing fileId" }, { status: 400 });
    }

    // Microsoft Graph API — get the download URL for a drive item
    const metadataResponse = await fetch(
      `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}`,
      {
        headers: {
          Authorization: `Bearer ${token.accessToken}`,
        },
      },
    );

    if (!metadataResponse.ok) {
      const payload = await metadataResponse.json().catch(() => null);
      return NextResponse.json(
        {
          error:
            payload?.error?.message || "Unable to get OneDrive file metadata.",
        },
        { status: metadataResponse.status },
      );
    }

    const metadata = await metadataResponse.json();
    const downloadUrl = metadata["@microsoft.graph.downloadUrl"];

    if (!downloadUrl) {
      return NextResponse.json(
        { error: "Unable to get download URL for OneDrive file." },
        { status: 500 },
      );
    }

    // Download the file content
    const fileResponse = await fetch(downloadUrl);

    if (!fileResponse.ok) {
      return NextResponse.json(
        { error: "Unable to download OneDrive file." },
        { status: fileResponse.status },
      );
    }

    const headers = new Headers();
    headers.set(
      "Content-Type",
      fileResponse.headers.get("Content-Type") ?? "application/octet-stream",
    );
    headers.set("X-File-Name", metadata.name ?? fileId);

    const body = await fileResponse.arrayBuffer();
    return new NextResponse(Buffer.from(body), { headers });
  } catch (err) {
    console.error("OneDrive download error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Unable to download OneDrive file.",
      },
      { status: 500 },
    );
  }
}