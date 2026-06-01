import type { SupabaseClient } from "@supabase/supabase-js";

const CREDIT_FIELD_CANDIDATES = [
  "credits",
  "remaining_credits",
  "credits_remaining",
  "balance",
  "ai_credits",
] as const;

function readCreditValue(record: Record<string, unknown>) {
  for (const field of CREDIT_FIELD_CANDIDATES) {
    const value = record[field];

    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string") {
      const parsedValue = Number(value);

      if (Number.isFinite(parsedValue)) {
        return parsedValue;
      }
    }
  }

  return 0;
}

export async function getUserCredits(
  supabase: SupabaseClient,
  userId: string
) {
  const { data, error } = await supabase
    .from("user_credits")
    .select("*")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (error || !data || typeof data !== "object" || Array.isArray(data)) {
    return 0;
  }

  return readCreditValue(data as Record<string, unknown>);
}
