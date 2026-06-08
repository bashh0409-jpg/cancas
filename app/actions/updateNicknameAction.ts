"use server";

import { createClient } from "@/lib/supabase/server";
import { updateNickname } from "@/lib/user/repository";

export async function updateNicknameAction(formData: FormData) {
  const nickname = String(formData.get("nickname") ?? "").trim();

  const supabase = await createClient();

  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (!user) {
    throw new Error("Unauthorized");
  }

  await updateNickname(supabase, user.id, nickname);
}
