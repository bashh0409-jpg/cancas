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

async function selectUserCreditsRow(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("user_credits")
    .select("*")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return null;
  }

  return data as Record<string, unknown>;
}

function findCreditField(record: Record<string, unknown>) {
  for (const field of CREDIT_FIELD_CANDIDATES) {
    const value = record[field];

    if (typeof value === "number" && Number.isFinite(value)) {
      return { field, value };
    }

    if (typeof value === "string") {
      const parsedValue = Number(value);

      if (Number.isFinite(parsedValue)) {
        return { field, value: parsedValue };
      }
    }
  }

  return null;
}

export async function consumeUserCredits(
  supabase: SupabaseClient,
  userId: string,
  amount = 2,
) {
  const record = await selectUserCreditsRow(supabase, userId);

  if (!record) {
    return false;
  }

  const creditEntry = findCreditField(record);

  if (!creditEntry || creditEntry.value < amount) {
    return false;
  }

  const updatePayload: Record<string, unknown> = {
    [creditEntry.field]: creditEntry.value - amount,
  };

  const { error } = await supabase
    .from("user_credits")
    .update(updatePayload)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }

  return true;
}

export async function getUserCredits(supabase: SupabaseClient, userId: string) {
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

/**
 * Set or upsert the user's credits to a specific value.
 * This will insert a row if none exists, or update the existing credit field.
 */
export async function setUserCredits(
  supabase: SupabaseClient,
  userId: string,
  amount: number,
) {
  // Try update first on common field names
  const possibleFields = [
    "credits",
    "remaining_credits",
    "credits_remaining",
    "balance",
    "ai_credits",
  ];

  for (const field of possibleFields) {
    const { error } = await supabase
      .from("user_credits")
      .update({ [field]: amount })
      .eq("user_id", userId);

    if (!error) {
      return true;
    }
  }

  // If update failed (no row), insert a new row with `credits` field
  const { error } = await supabase.from("user_credits").insert([
    {
      user_id: userId,
      credits: amount,
    },
  ]);

  if (error) throw error;
  return true;
}
