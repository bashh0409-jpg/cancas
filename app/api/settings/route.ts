import { NextRequest, NextResponse } from "next/server";
import { createClient, getAuthenticatedUser } from "@/lib/supabase/server";
import {
  getUserSettings,
  upsertUserSettings,
  type UserSettings,
} from "@/lib/user/settingsRepository";

export async function GET() {
  try {
    const supabase = await createClient();
    const user = await getAuthenticatedUser(supabase);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings = await getUserSettings(supabase, user.id);

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("[Settings GET Error]", error);
    return NextResponse.json(
      { error: "Failed to load settings" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await getAuthenticatedUser(supabase);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as { settings?: UserSettings };

    if (!body.settings || typeof body.settings !== "object") {
      return NextResponse.json(
        { error: "Settings object is required" },
        { status: 400 },
      );
    }

    const settings = await upsertUserSettings(supabase, user.id, body.settings);

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("[Settings POST Error]", error);
    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 },
    );
  }
}