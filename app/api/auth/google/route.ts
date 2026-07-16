import { NextRequest, NextResponse } from "next/server";
import { clearSupabaseAuthCookies, createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const origin =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    request.nextUrl.origin;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/api/auth/callback`,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error || !data?.url) {
    const response = NextResponse.json(
      {
        error: error?.message ?? "Unable to start Google login",
      },
      { status: 500 },
    );

    clearSupabaseAuthCookies(response, request);
    console.error("OAuth Error:", error);

    return response;
  }

  const response = NextResponse.redirect(data.url);
  clearSupabaseAuthCookies(response, request);

  return response;
}
