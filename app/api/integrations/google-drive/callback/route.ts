import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { createClient } from "@/lib/supabase/server";
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
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
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
      expiresAt: tokens.expiry_date ?? undefined,
    });

    return NextResponse.redirect(new URL("/home?google=connected", req.url));
  } catch (err) {
    console.error("Google callback error:", err);

    return NextResponse.json(
      { error: "Google OAuth callback failed" },
      { status: 500 },
    );
  }
}
