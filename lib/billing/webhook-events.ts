import type { SupabaseClient } from "@supabase/supabase-js";

export type BillingWebhookProvider = "stripe" | "payfast" | "polar";

/**
 * Returns true when this webhook should be processed, false when it is a duplicate.
 */
export async function claimWebhookEvent(
  supabase: SupabaseClient,
  provider: BillingWebhookProvider,
  eventId: string,
): Promise<boolean> {
  const scope = `billing.webhook.${provider}`;
  const { error } = await supabase.from("idempotency_keys").insert({
    scope,
    key: eventId,
    response: {
      processedAt: new Date().toISOString(),
    },
  });

  if (!error) {
    return true;
  }

  if (error.code === "23505") {
    return false;
  }

  throw error;
}
