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
      return NextResponse.json(
        { error: "Missing path parameter" },
        { status: 400 },
      );
    }

    const response = await fetch(
      "https://content.dropboxapi.com/2/files/get_thumbnail_v2",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token.accessToken}`,
          "Dropbox-API-Arg": JSON.stringify({
            resource: { ".tag": "file", path },
            format: "jpeg",
            size: "w256h256",
            mode: "strict",
          }),
        },
      },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Unable to download Dropbox thumbnail" },
        { status: response.status },
      );
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (err) {
    console.error("Dropbox thumbnail error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Unable to load Dropbox thumbnail.",
      },
      { status: 500 },
    );
  }
}