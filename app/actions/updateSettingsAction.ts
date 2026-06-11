"use server";

import { createClient } from "@/lib/supabase/server";
import {
  upsertUserSettings,
  type UserSettings,
} from "@/lib/user/settingsRepository";

export async function updateSettingsAction(formData: FormData) {
  const supabase = await createClient();

  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (!user) {
    throw new Error("Unauthorized");
  }

  const settings: UserSettings = {
    product_updates: String(formData.get("product_updates")) === "true",
    canvas_activity: String(formData.get("canvas_activity")) === "true",
  };

  await upsertUserSettings(supabase, user.id, settings);
}
