import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const origin =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    request.nextUrl.origin;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "azure",
    options: {
      redirectTo: `${origin}/api/auth/callback?next=/home`,
    },
  });

  if (error || !data?.url) {
    return NextResponse.json(
      { error: error?.message ?? "Unable to start Azure sign-in" },
      { status: 500 },
    );
  }

  return NextResponse.redirect(data.url);
}
