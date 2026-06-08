"use server";

import { createClient } from "@/lib/supabase/server";

export async function deleteAccountAction() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Unauthorized");
  }

  // delete profile first (RLS-safe cleanup)
  const { error: profileError } = await supabase
    .from("profiles")
    .delete()
    .eq("id", user.id);

  if (profileError) {
    throw profileError;
  }

  // delete auth user (requires SERVICE ROLE)
  const service = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // never expose to client
  );

  const { error: authError } = await service.auth.admin.deleteUser(user.id);

  if (authError) {
    throw authError;
  }

  await supabase.auth.signOut();
}
