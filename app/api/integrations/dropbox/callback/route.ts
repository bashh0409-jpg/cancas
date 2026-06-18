import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { upsertIntegrationToken } from "@/lib/integrations/store/store";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get("code");
    const state = req.nextUrl.searchParams.get("state");

    if (!code) {
      return NextResponse.json(
        { error: "Missing authorization code" },
        { status: 400 },
      );
    }

    const redirectUri = process.env.DROPBOX_REDIRECT_URI;

    if (
      !process.env.DROPBOX_CLIENT_ID ||
      !process.env.DROPBOX_CLIENT_SECRET ||
      !redirectUri
    ) {
      return NextResponse.json(
        { error: "Missing Dropbox OAuth environment variables" },
        { status: 500 },
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

    const tokenUrl = "https://api.dropboxapi.com/oauth2/token";
    const body = new URLSearchParams({
      code,
      grant_type: "authorization_code",
      client_id: process.env.DROPBOX_CLIENT_ID,
      client_secret: process.env.DROPBOX_CLIENT_SECRET,
      redirect_uri: redirectUri,
    });

    const tokenResponse = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error("Dropbox token response error:", tokenData);
      return NextResponse.json(
        { error: "Failed to exchange Dropbox authorization code" },
        { status: 500 },
      );
    }

    await upsertIntegrationToken({
      userId: user.id,
      provider: "dropbox",
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token ?? undefined,
      expiresAt: tokenData.expires_in
        ? Date.now() + tokenData.expires_in * 1000
        : undefined,
    });

    return NextResponse.redirect(new URL("/home?dropbox=connected", req.url));
  } catch (err) {
    console.error("Dropbox callback error:", err);

    return NextResponse.json(
      { error: "Dropbox OAuth callback failed" },
      { status: 500 },
    );
  }
}
