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

export async function addUserCredits(
  supabase: SupabaseClient,
  userId: string,
  amount: number,
) {
  if (amount <= 0) {
    return true;
  }

  const record = await selectUserCreditsRow(supabase, userId);

  if (!record) {
    const { error } = await supabase.from("user_credits").insert([
      {
        user_id: userId,
        balance: amount,
        lifetime_earned: amount,
      },
    ]);

    if (error) throw error;
    return true;
  }

  const creditEntry = findCreditField(record);
  const currentCredit = creditEntry?.value ?? 0;
  const updatePayload: Record<string, unknown> = {
    [creditEntry?.field ?? "balance"]: currentCredit + amount,
  };

  const lifetimeEarned = record.lifetime_earned;
  if (typeof lifetimeEarned === "number" && Number.isFinite(lifetimeEarned)) {
    updatePayload.lifetime_earned = lifetimeEarned + amount;
  } else if (typeof lifetimeEarned === "string") {
    const parsedLifetime = Number(lifetimeEarned);
    if (Number.isFinite(parsedLifetime)) {
      updatePayload.lifetime_earned = parsedLifetime + amount;
    }
  } else {
    updatePayload.lifetime_earned = amount;
  }

  const { error } = await supabase
    .from("user_credits")
    .update(updatePayload)
    .eq("user_id", userId);

  if (error) throw error;
  return true;
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
  const record = await selectUserCreditsRow(supabase, userId);

  if (!record) {
    const { error } = await supabase.from("user_credits").insert([
      {
        user_id: userId,
        credits: amount,
        lifetime_earned: amount,
      },
    ]);

    if (error) throw error;
    return true;
  }

  const creditEntry = findCreditField(record);
  const field = creditEntry?.field ?? "balance";

  const { error } = await supabase
    .from("user_credits")
    .update({ [field]: amount })
    .eq("user_id", userId);

  if (error) throw error;
  return true;
}
