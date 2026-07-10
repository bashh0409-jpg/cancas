import { NextRequest, NextResponse } from "next/server";
import { createClient, getAuthenticatedUser } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    // Try OneDrive-specific vars first, then fall back to shared Azure AD vars
    const clientId = process.env.ONEDRIVE_CLIENT_ID ?? process.env.AZURE_CLIENT_ID;
    const redirectUri = process.env.ONEDRIVE_REDIRECT_URI ?? process.env.AZURE_REDIRECT_URI;

    if (!clientId || !redirectUri) {
      return NextResponse.json(
        { error: "Missing OneDrive OAuth environment variables. Set ONEDRIVE_CLIENT_ID and ONEDRIVE_REDIRECT_URI, or AZURE_CLIENT_ID and AZURE_REDIRECT_URI." },
        { status: 500 },
      );
    }

    const supabase = await createClient();
    const user = await getAuthenticatedUser(supabase);

    if (!user) {
      return NextResponse.json(
        { error: "User must be signed in to connect OneDrive" },
        { status: 401 },
      );
    }

    const canvasId = req.nextUrl.searchParams.get("canvasId");
    const statePayload = canvasId
      ? JSON.stringify({ userId: user.id, canvasId })
      : user.id;

    // Microsoft identity platform v2.0 endpoint
    // Scopes: Files.Read (read user files), offline_access (refresh token)
    const params = new URLSearchParams({
      client_id: clientId,
      response_type: "code",
      redirect_uri: redirectUri,
      scope: "Files.Read offline_access",
      state: statePayload,
    });

    const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("OneDrive connect error:", error);

    return NextResponse.json(
      { error: "Failed to initialize OneDrive connection" },
      { status: 500 },
    );
  }
}