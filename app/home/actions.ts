"use server";

import { createUserCanvas } from "@/lib/canvas/repository";
import { consumeUserCredits } from "@/lib/credits/repository";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function createCanvasAction() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (!user) {
    redirect("/signin");
  }

  const hasCredits = await consumeUserCredits(supabase, user.id, 2);

  if (!hasCredits) {
    redirect("/home?error=no_credits");
  }

  const canvasId = await createUserCanvas(supabase, user.id);
  redirect(`/canvas/${canvasId}`);
}
