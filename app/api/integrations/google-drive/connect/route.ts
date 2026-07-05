// src/app/api/integrations/google-drive/connect/route.ts

import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
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
        {
          error: "Missing Google OAuth environment variables",
        },
        {
          status: 500,
        },
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "User must be signed in to connect Google Drive" },
        { status: 401 },
      );
    }

    // Encode canvas redirect in state if provided
    const canvasId = req.nextUrl.searchParams.get("canvasId");
    const statePayload = canvasId
      ? JSON.stringify({ userId: user.id, canvasId })
      : user.id;

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri,
    );

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      state: statePayload,
      scope: [
        "openid",
        "email",
        "profile",
        "https://www.googleapis.com/auth/drive.file",
      ],
    });

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("Google Drive connect error:", error);

    return NextResponse.json(
      {
        error: "Failed to initialize Google Drive connection",
      },
      {
        status: 500,
      },
    );
  }
}
