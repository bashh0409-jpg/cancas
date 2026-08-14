"use server";

import { createClient, getAuthenticatedUser } from "@/lib/supabase/server";
import {
  getUserSettings,
  upsertUserSettings,
  type UserSettings,
} from "@/lib/user/settingsRepository";

export async function updateSettingsAction(formData: FormData) {
  const supabase = await createClient();
  const user = await getAuthenticatedUser(supabase);

  if (!user) {
    throw new Error("Unauthorized");
  }

  const settings: UserSettings = {
    product_updates: String(formData.get("product_updates")) === "true",
    canvas_activity: String(formData.get("canvas_activity")) === "true",
  };

  const existingSettings = await getUserSettings(supabase, user.id);
  await upsertUserSettings(supabase, user.id, {
    ...existingSettings,
    ...settings,
  });
}
