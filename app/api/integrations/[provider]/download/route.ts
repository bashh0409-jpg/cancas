import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { getIntegrationToken } from "@/lib/integrations/store/store";

function normalizeProvider(provider: string) {
  if (provider === "google-drive" || provider === "google_drive") {
    return "google_drive" as const;
  }

  if (provider === "dropbox") {
    return "dropbox" as const;
  }

  return null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  try {
    const { provider: providerId } = await params;
    const providerKey = normalizeProvider(providerId);

    if (!providerKey) {
      return NextResponse.json(
        { error: "Unsupported provider" },
        { status: 400 },
      );
    }

    const token = await getIntegrationToken(providerKey);

    if (!token) {
      return NextResponse.json(
        { error: "Not connected to cloud provider" },
        { status: 401 },
      );
    }

    if (providerKey === "google_drive") {
      const fileId = new URL(req.url).searchParams.get("fileId");

      if (!fileId) {
        return NextResponse.json({ error: "Missing fileId" }, { status: 400 });
      }

      const redirectUri =
        process.env.GOOGLE_REDIRECT_URI ??
        process.env.GOOGLE_DRIVE_REDIRECT_URI ??
        `${req.nextUrl.origin}/api/integrations/google-drive/callback`;

      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        redirectUri,
      );

      oauth2Client.setCredentials({
        access_token: token.accessToken,
        refresh_token: token.refreshToken,
        expiry_date: token.expiresAt,
      });

      const drive = google.drive({ version: "v3", auth: oauth2Client });
      const response = await drive.files.get(
        { fileId, alt: "media" },
        { responseType: "stream" },
      );

      if (!response.data) {
        return NextResponse.json(
          { error: "Unable to download Google Drive file" },
          { status: 500 },
        );
      }

      const nodeStream = response.data as import("stream").Readable;
      const webStream = new ReadableStream({
        start(controller) {
          nodeStream.on("data", (chunk: Buffer | string) => {
            controller.enqueue(
              typeof chunk === "string" ? Buffer.from(chunk) : chunk,
            );
          });
          nodeStream.on("end", () => controller.close());
          nodeStream.on("error", (err: Error) => controller.error(err));
        },
      });
      const headers = new Headers();
      headers.set("Content-Type", "application/octet-stream");
      headers.set("Content-Disposition", `attachment; filename="${fileId}"`);

      return new NextResponse(webStream, { headers });
    }

    if (providerKey === "dropbox") {
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
    }

    return NextResponse.json(
      { error: "Invalid cloud provider" },
      { status: 400 },
    );
  } catch (err) {
    console.error("Cloud download error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Unable to download cloud file.",
      },
      { status: 500 },
    );
  }
}
