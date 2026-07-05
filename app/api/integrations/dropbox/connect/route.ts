// src/app/api/integrations/dropbox/connect/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const clientId = process.env.DROPBOX_CLIENT_ID;
    const redirectUri = process.env.DROPBOX_REDIRECT_URI;

    if (!clientId || !redirectUri) {
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
        { error: "User must be signed in to connect Dropbox" },
        { status: 401 },
      );
    }

    // Encode canvas redirect in state if provided
    const canvasId = req.nextUrl.searchParams.get("canvasId");
    const statePayload = canvasId
      ? JSON.stringify({ userId: user.id, canvasId })
      : user.id;

    const params = new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      redirect_uri: redirectUri,
      state: statePayload,
      token_access_type: "offline",
    });

    const authUrl = `https://www.dropbox.com/oauth2/authorize?${params.toString()}`;

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("Dropbox connect error:", error);

    return NextResponse.json(
      { error: "Failed to initialize Dropbox connection" },
      { status: 500 },
    );
  }
}
