import { NextRequest, NextResponse } from "next/server";
import { getIntegrationToken } from "@/lib/integrations/store/store";

export async function GET(req: NextRequest) {
  try {
    const token = await getIntegrationToken("dropbox");

    if (!token) {
      return NextResponse.json(
        { error: "Not connected to Dropbox" },
        { status: 401 },
      );
    }

    const path = new URL(req.url).searchParams.get("path");

    if (!path) {
      return NextResponse.json({ error: "Missing path" }, { status: 400 });
    }

    const response = await fetch(
      "https://content.dropboxapi.com/2/files/download",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token.accessToken}`,
          "Dropbox-API-Arg": JSON.stringify({ path }),
        },
      },
    );

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      return NextResponse.json(
        {
          error: payload?.error_summary || "Unable to download Dropbox file.",
        },
        { status: response.status },
      );
    }

    const headers = new Headers();
    headers.set(
      "Content-Type",
      response.headers.get("Content-Type") ?? "application/octet-stream",
    );
    headers.set(
      "X-File-Name",
      response.headers.get("Dropbox-API-Result") ?? path,
    );

    const body = await response.arrayBuffer();
    return new NextResponse(Buffer.from(body), { headers });
  } catch (err) {
    console.error("Dropbox download error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Unable to download Dropbox file.",
      },
      { status: 500 },
    );
  }
}
