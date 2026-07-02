import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");

  if (!token || token !== Deno.env.get("CRON_SECRET")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data, error } = await supabase
    .from("canvases")
    .delete()
    .lt(
      "deleted_at",
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    )
    .select("id");

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }

  return new Response(
    JSON.stringify({ ok: true, purged: data?.length ?? 0, ids: data }),
    { headers: { "Content-Type": "application/json" } }
  );
});