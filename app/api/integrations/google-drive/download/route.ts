import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { getIntegrationToken } from "@/lib/integrations/store/store";

export async function GET(req: NextRequest) {
  try {
    const token = await getIntegrationToken("google_drive");

    if (!token) {
      return NextResponse.json(
        { error: "Not connected to Google Drive" },
        { status: 401 },
      );
    }

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

    return new NextResponse(webStream, {
      headers: new Headers({
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${fileId}"`,
      }),
    });
  } catch (err) {
    console.error("Google Drive download error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Unable to download Google Drive file.",
      },
      { status: 500 },
    );
  }
}
