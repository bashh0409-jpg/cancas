import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { createClient, getAuthenticatedUser } from "@/lib/supabase/server";
import { upsertIntegrationToken } from "@/lib/integrations/store/store";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get("code");

    if (!code) {
      return NextResponse.json(
        { error: "Missing authorization code" },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const user = await getAuthenticatedUser(supabase);

    if (!user) {
      return NextResponse.json(
        { error: "Unauthenticated user" },
        { status: 401 },
      );
    }

    const defaultRedirectUri = `${req.nextUrl.origin}/api/integrations/google-drive/callback`;
    const redirectUri =
      process.env.GOOGLE_REDIRECT_URI ??
      process.env.GOOGLE_DRIVE_REDIRECT_URI ??
      defaultRedirectUri;

    if (
      !process.env.GOOGLE_CLIENT_ID ||
      !process.env.GOOGLE_CLIENT_SECRET ||
      !redirectUri
    ) {
      return NextResponse.json(
        { error: "Missing Google OAuth environment variables" },
        { status: 500 },
      );
    }

    const oauth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri,
    );

    const { tokens } = await oauth.getToken(code);

    if (!tokens.access_token) {
      return NextResponse.json(
        { error: "No access token returned from Google" },
        { status: 400 },
      );
    }

    await upsertIntegrationToken({
      userId: user.id,
      provider: "google_drive",
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? undefined,
      expiresAt: Date.now() + 21 * 24 * 60 * 60 * 1000,
    });

    // Parse state to determine redirect — supports both plain userId and JSON { userId, canvasId }
    const stateParam = req.nextUrl.searchParams.get("state");
    let redirectPath = "/home?google=connected";

    if (stateParam) {
      try {
        const parsed = JSON.parse(stateParam);
        if (parsed.canvasId) {
          redirectPath = `/canvas/${parsed.canvasId}?google=connected`;
        }
      } catch {
        // state was a plain userId string, use default redirect
      }
    }

    return NextResponse.redirect(new URL(redirectPath, req.url));
  } catch (err) {
    console.error("Google callback error:", err);

    return NextResponse.json(
      { error: "Google OAuth callback failed" },
      { status: 500 },
    );
  }
}
