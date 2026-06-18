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

function isImageName(name: string) {
  return /\.(png|jpe?g|gif|webp|avif|bmp|svg)$/i.test(name);
}

export async function GET(
  req: NextRequest,
  { params }: { params: { provider: string } },
) {
  try {
    const providerId = params.provider;
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
        fields: "files(id,name,mimeType,size)",
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
            : file.mimeType.startsWith("image/") || isImageName(file.name ?? "")
              ? "image"
              : "file",
      }));

      return NextResponse.json({
        folder: {
          id: folderId,
          name: folderId === "root" ? "My Drive" : folderId,
        },
        items,
      });
    }

    if (providerId === "dropbox") {
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
              payload?.error_summary ||
              "Unable to load Dropbox folder contents.",
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
      const items = (data.entries ?? []).map((entry: DropboxEntry) => ({
        id: entry.id,
        name: entry.name,
        mimeType: entry[".tag"] === "folder" ? "" : "application/octet-stream",
        size: entry.size ?? 0,
        isFolder: entry[".tag"] === "folder",
        fileType:
          entry[".tag"] === "folder"
            ? "folder"
            : isImageName(entry.name)
              ? "image"
              : "file",
        path: entry.path_lower ?? entry.path_display,
      }));

      return NextResponse.json({
        folder: { id: path || "", name: path === "" ? "Dropbox" : path },
        items,
      });
    }

    return NextResponse.json(
      { error: "Invalid cloud provider" },
      { status: 400 },
    );
  } catch (err) {
    console.error("Cloud list error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Unable to load cloud files.",
      },
      { status: 500 },
    );
  }
}
