import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? request.nextUrl.origin;

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
    console.error("OAuth Error:", error);

    return NextResponse.json(
      {
        error: error?.message ?? "Unable to start Google login",
      },
      { status: 500 },
    );
  }

  return NextResponse.redirect(data.url);
}
