import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { purgeTrashedCanvases } from "@/lib/canvas/repository";

export async function POST(request: NextRequest) {
  // 🔐 AUTH CHECK (CRON PROTECTION)
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token || token !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 🔧 ENV CHECK
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: "Missing Supabase service role config" },
      { status: 500 },
    );
  }

  // 🧠 Supabase admin client
  const service = createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
    },
  });

  try {
    const purgedIds = await purgeTrashedCanvases(service, 30);

    return NextResponse.json({
      ok: true,
      purged: purgedIds.length,
      ids: purgedIds,
    });
  } catch (e) {
    console.error("Purge failed", e);

    return NextResponse.json({ error: "Purge failed" }, { status: 500 });
  }
}
