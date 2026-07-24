import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { upsertIntegrationToken } from "@/lib/integrations/store/store";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get("code");
    const state = req.nextUrl.searchParams.get("state");
    const error = req.nextUrl.searchParams.get("error");

    if (error) {
      return NextResponse.redirect(
        new URL(`/signin?error=${encodeURIComponent(error)}`, req.url),
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL("/signin?error=missing_params", req.url),
      );
    }

    // Parse state to get userId
    let userId: string;
    try {
      const parsed = JSON.parse(state);
      userId = parsed.userId;
    } catch {
      userId = state;
    }

    // Try OneDrive-specific vars first, then fall back to shared Azure AD vars
    const clientId = process.env.ONEDRIVE_CLIENT_ID ?? process.env.AZURE_CLIENT_ID;
    const clientSecret = process.env.ONEDRIVE_CLIENT_SECRET ?? process.env.AZURE_CLIENT_SECRET;
    const redirectUri = process.env.ONEDRIVE_REDIRECT_URI ?? process.env.AZURE_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      return NextResponse.json(
        { error: "Missing OneDrive OAuth environment variables. Set ONEDRIVE_CLIENT_ID/ONEDRIVE_CLIENT_SECRET/ONEDRIVE_REDIRECT_URI, or AZURE_CLIENT_ID/AZURE_CLIENT_SECRET/AZURE_REDIRECT_URI." },
        { status: 500 },
      );
    }

    // Exchange authorization code for tokens
    const tokenResponse = await fetch(
      "https://login.microsoftonline.com/common/oauth2/v2.0/token",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      },
    );

    if (!tokenResponse.ok) {
      const payload = await tokenResponse.json().catch(() => null);
      console.error("OneDrive token exchange error:", payload);
      return NextResponse.redirect(
        new URL("/signin?error=token_exchange_failed", req.url),
      );
    }

    const tokens = await tokenResponse.json();

    // Calculate expiry date — 21 days from now
    const expiresAt = Date.now() + 21 * 24 * 60 * 60 * 1000;

    // Store the token
    await upsertIntegrationToken({
      userId,
      provider: "onedrive",
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt,
    });

    // Redirect back to origin (or to canvas if specified)
    const origin = new URL(req.url).origin;
    let redirectTo = origin;

    try {
      const parsed = JSON.parse(state);
      if (parsed.canvasId) {
        redirectTo = `${origin}/canvas/${parsed.canvasId}`;
      }
    } catch {
      // state was just userId, redirect to home
      redirectTo = `${origin}/home`;
    }

    return NextResponse.redirect(redirectTo);
  } catch (error) {
    console.error("OneDrive callback error:", error);
    return NextResponse.redirect(
      new URL("/signin?error=callback_error", req.url),
    );
  }
}