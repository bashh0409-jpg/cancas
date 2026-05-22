import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const origin = request.nextUrl.origin;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "azure",
    options: {
      redirectTo: `${origin}/api/auth/callback?next=/home`,
    },
  });

  if (error || !data?.url) {
    return NextResponse.json(
      { error: error?.message ?? "Unable to start Azure login" },
      { status: 500 },
    );
  }

  return NextResponse.redirect(data.url);
}
