import { createClient } from "@/lib/supabase/server";

export type IntegrationProvider = "google_drive" | "dropbox" | "onedrive";

export type IntegrationToken = {
  provider: IntegrationProvider;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
};

export interface IntegrationTokenParams {
  userId: string;
  provider: IntegrationProvider;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
}

export async function upsertIntegrationToken({
  userId,
  provider,
  accessToken,
  refreshToken,
  expiresAt,
}: IntegrationTokenParams) {
  const supabase = await createClient();

  const { error } = await supabase.from("integration_tokens").upsert(
    {
      user_id: userId,
      provider,
      access_token: accessToken,
      refresh_token: refreshToken ?? null,
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "user_id, provider",
      ignoreDuplicates: false,
    },
  );

  if (error) {
    console.error("Failed to upsert integration token:", error);
    throw error;
  }
}

type IntegrationTokenRecord = {
  provider: IntegrationProvider;
  access_token: string;
  refresh_token: string | null;
  expires_at: string | null;
};

export async function deleteIntegrationToken(provider: IntegrationProvider) {
  const supabase = await createClient();
  
  let user;
  try {
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      throw authError || new Error("Unable to determine authenticated user.");
    }
    
    user = authUser;
  } catch (err: unknown) {
    const error = err as Error;
    throw new Error(
      `Unable to determine authenticated user: ${error.message}`,
    );
  }

  const { error } = await supabase
    .from("integration_tokens")
    .delete()
    .eq("user_id", user.id)
    .eq("provider", provider);

  if (error) {
    console.error("Failed to delete integration token:", error);
    throw error;
  }
}

export async function getIntegrationToken(provider: IntegrationProvider) {
  const supabase = await createClient();
  
  let user;
  try {
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      throw authError || new Error("Unable to determine authenticated user.");
    }
    
    user = authUser;
  } catch (err: unknown) {
    const error = err as Error;
    throw new Error(
      `Unable to determine authenticated user: ${error.message}`,
    );
  }

  const { data, error } = await supabase
    .from("integration_tokens")
    .select("provider, access_token, refresh_token, expires_at")
    .eq("user_id", user.id)
    .eq("provider", provider)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    console.error("Failed to fetch integration token:", error);
    throw error;
  }

  if (!data) {
    return null;
  }

  return {
    provider: data.provider,
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? undefined,
    expiresAt: data.expires_at ? Date.parse(data.expires_at) : undefined,
  };
}