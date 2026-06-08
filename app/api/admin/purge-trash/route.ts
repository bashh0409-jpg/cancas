import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { purgeTrashedCanvases } from "@/lib/canvas/repository";

export async function POST(_request: NextRequest) {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: "Missing Supabase service role config" },
      { status: 500 },
    );
  }

  const service = createSupabaseClient(supabaseUrl, serviceRoleKey);

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
