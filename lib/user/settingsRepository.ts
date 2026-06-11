import type { SupabaseClient } from "@supabase/supabase-js";

export type UserSettings = {
  product_updates?: boolean;
  canvas_activity?: boolean;
  [key: string]: unknown;
};

export async function getUserSettings(
  supabase: SupabaseClient,
  userId: string,
): Promise<UserSettings> {
  const { data, error } = await supabase
    .from("user_settings")
    .select("settings")
    .eq("user_id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return {};
    }
    throw error;
  }

  return (data?.settings as UserSettings) ?? {};
}

export async function upsertUserSettings(
  supabase: SupabaseClient,
  userId: string,
  settings: UserSettings,
): Promise<UserSettings> {
  const { data, error } = await supabase
    .from("user_settings")
    .upsert(
      {
        user_id: userId,
        settings,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id",
      },
    )
    .select("settings")
    .single();

  if (error) {
    throw error;
  }

  return (data?.settings as UserSettings) ?? settings;
}
