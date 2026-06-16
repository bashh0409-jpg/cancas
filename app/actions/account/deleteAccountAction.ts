"use server";

import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export async function deleteAccountAction() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing Supabase service role configuration. Set SUPABASE_SERVICE_ROLE_KEY and SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL.",
    );
  }

  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Unauthorized");
  }

  const userId = user.id;

  // Move all canvases to trash (soft-delete) instead of permanently deleting them
  const deletedAt = new Date().toISOString();
  const { error: canvasError } = await supabase
    .from("canvases")
    .update({ deleted_at: deletedAt })
    .eq("user_id", userId)
    .is("deleted_at", null);

  if (canvasError) {
    throw canvasError;
  }

  const { error: creditsError } = await supabase
    .from("user_credits")
    .delete()
    .eq("user_id", userId);

  if (creditsError) {
    throw creditsError;
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .delete()
    .eq("id", userId);

  if (profileError) {
    throw profileError;
  }

  const service = createSupabaseClient(supabaseUrl, serviceRoleKey);

  const { error: authError } = await service.auth.admin.deleteUser(userId);

  if (authError) {
    throw authError;
  }
}
