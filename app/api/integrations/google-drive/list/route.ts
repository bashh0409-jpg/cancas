import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { getIntegrationToken } from "@/lib/integrations/store/store";

function isImageName(name: string) {
  return /\.(png|jpe?g|gif|webp|avif|bmp|svg)$/i.test(name);
}

export async function GET(req: NextRequest) {
  try {
    const token = await getIntegrationToken("google_drive");

    if (!token) {
      return NextResponse.json(
        { error: "Not connected to Google Drive" },
        { status: 401 },
      );
    }

    const folderId = new URL(req.url).searchParams.get("folderId") ?? "root";

    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return NextResponse.json(
        { error: "Missing Google Drive OAuth environment variables" },
        { status: 500 },
      );
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
    const q =
      folderId === "root" ? "'root' in parents" : `'${folderId}' in parents`;
    const response = await drive.files.list({
      q,
      fields: "files(id,name,mimeType,size,thumbnailLink)",
      pageSize: 50,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    const items = (response.data.files ?? []).map((file) => ({
      id: file.id ?? "",
      name: file.name ?? "Untitled",
      mimeType: file.mimeType ?? "application/octet-stream",
      size: Number(file.size ?? 0),
      isFolder: file.mimeType === "application/vnd.google-apps.folder",
      fileType:
        file.mimeType === "application/vnd.google-apps.folder"
          ? "folder"
          : file.mimeType?.startsWith("image/") || isImageName(file.name ?? "")
            ? "image"
            : "file",
      thumbnailUrl:
        file.thumbnailLink &&
        (file.mimeType?.startsWith("image/") || isImageName(file.name ?? ""))
          ? file.thumbnailLink
          : undefined,
    }));

    return NextResponse.json({
      folder: {
        id: folderId,
        name: folderId === "root" ? "My Drive" : folderId,
      },
      items,
    });
  } catch (err) {
    console.error("Google Drive list error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Unable to load Google Drive files.",
      },
      { status: 500 },
    );
  }
}
