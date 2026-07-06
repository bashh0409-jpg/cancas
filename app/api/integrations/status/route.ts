import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("integration_tokens")
      .select("provider, expires_at")
      .eq("user_id", user.id);

    if (error) {
      console.error("Failed to fetch integration tokens:", error);
      return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
    }

    const now = Date.now();

    const connected = {
      google_drive: false,
      dropbox: false,
      onedrive: false,
    } as Record<string, boolean>;

    const expired = {
      google_drive: false,
      dropbox: false,
      onedrive: false,
    } as Record<string, boolean>;

    (data || []).forEach((row: { provider: string; expires_at: string | null }) => {
      if (row.provider) {
        connected[row.provider] = true;

        // Check if token has an expiry date and it's in the past
        if (row.expires_at && Date.parse(row.expires_at) <= now) {
          expired[row.provider] = true;
        }
      }
    });

    return NextResponse.json({ connected, expired });
  } catch (err) {
    console.error("Integrations status error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
