"use server";

import { createClient as createServerSupabaseClient, getAuthenticatedUser } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export async function deleteAccountAction(verificationCode: string) {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing Supabase service role configuration. Set SUPABASE_SERVICE_ROLE_KEY and SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL.",
    );
  }

  const supabase = await createServerSupabaseClient();
  const user = await getAuthenticatedUser(supabase);

  if (!user) {
    throw new Error("Unauthorized");
  }

  const userId = user.id;

  // Verify the deletion code
  const { data: codeRecord, error: codeError } = await supabase
    .from("account_deletion_codes")
    .select("code, expires_at")
    .eq("user_id", userId)
    .single();

  if (codeError || !codeRecord) {
    throw new Error("Verification code not found. Please request a new code.");
  }

  // Check if code has expired
  if (new Date(codeRecord.expires_at) < new Date()) {
    await supabase
      .from("account_deletion_codes")
      .delete()
      .eq("user_id", userId);
    throw new Error(
      "Verification code has expired. Please request a new code.",
    );
  }

  // Verify the code matches
  if (codeRecord.code !== verificationCode.trim()) {
    throw new Error("Invalid verification code.");
  }

  // Delete the used code
  await supabase.from("account_deletion_codes").delete().eq("user_id", userId);

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
