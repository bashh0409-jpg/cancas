"use server";

import {
  createUserCanvasWithCreditOnce,
} from "@/lib/canvas/repository";
import {
  requireIdempotencyKey,
  userScopedIdempotencyKey,
} from "@/lib/idempotency";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function createCanvasAction(idempotencyKey: string) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (!user) {
    redirect("/signin");
  }

  const scopedIdempotencyKey = userScopedIdempotencyKey(
    user.id,
    requireIdempotencyKey(idempotencyKey),
  );

  const idempotentResult = await createUserCanvasWithCreditOnce(
    supabase,
    user.id,
    scopedIdempotencyKey,
  );

  if (idempotentResult.slug) {
    redirect(`/canvas/${idempotentResult.slug}`);
  }

  if (idempotentResult.insufficientCredits) {
    redirect("/home?error=no_credits");
  }
}
