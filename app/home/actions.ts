"use server";

import {
  createUserCanvas,
  createUserCanvasWithCreditOnce,
} from "@/lib/canvas/repository";
import { consumeUserCredits } from "@/lib/credits/repository";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function createCanvasAction(idempotencyKey: string) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (!user) {
    redirect("/signin");
  }

  const idempotentResult = await createUserCanvasWithCreditOnce(
    supabase,
    user.id,
    idempotencyKey,
  );

  if (idempotentResult.slug) {
    redirect(`/canvas/${idempotentResult.slug}`);
  }

  if (idempotentResult.insufficientCredits) {
    redirect("/home?error=no_credits");
  }

  const hasCredits = await consumeUserCredits(
    supabase,
    user.id,
    2,
    idempotencyKey,
    "canvas.create.fallback",
  );

  if (!hasCredits) {
    redirect("/home?error=no_credits");
  }

  const canvasId = await createUserCanvas(supabase, user.id);
  redirect(`/canvas/${canvasId}`);
}
