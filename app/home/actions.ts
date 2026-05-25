"use server";

import { createUserCanvas } from "@/lib/canvas/repository";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function createCanvasAction() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (!user) {
    redirect("/signin");
  }

  const canvasId = await createUserCanvas(supabase, user.id);
  redirect(`/canvas/${canvasId}`);
}
