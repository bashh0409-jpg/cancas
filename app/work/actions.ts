"use server";

import {
  createUserCanvasWithCreditOnce,
} from "@/lib/canvas/repository";
import {
  requireIdempotencyKey,
  userScopedIdempotencyKey,
} from "@/lib/idempotency";
import { createClient, getAuthenticatedUser } from "@/lib/supabase/server";

export type CreateCanvasResult =
  | { status: "created"; slug: string }
  | { status: "no_credits" }
  | { status: "unauthorized" };

export async function createCanvasAction(
  idempotencyKey: string,
): Promise<CreateCanvasResult> {
  const supabase = await createClient();
  const user = await getAuthenticatedUser(supabase);

  if (!user) {
    return { status: "unauthorized" };
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
    return { status: "created", slug: idempotentResult.slug };
  }

  if (idempotentResult.insufficientCredits) {
    return { status: "no_credits" };
  }

  throw new Error("Unable to create canvas");
}
