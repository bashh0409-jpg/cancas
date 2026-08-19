import { createClient } from "@/lib/supabase/server";

export type IntegrationProvider = "google_drive" | "dropbox" | "onedrive";

export type IntegrationToken = {
  provider: IntegrationProvider;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
};

const REFRESH_WINDOW_MS = 5 * 60 * 1000;
// Earlier versions stored a synthetic 21-day expiry for Google Drive and
// Dropbox. Their access tokens are short-lived, so treat those records as
// needing a one-time refresh as well.
const LEGACY_EXPIRY_THRESHOLD_MS = 24 * 60 * 60 * 1000;

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

  const token: IntegrationToken = {
    provider: data.provider,
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? undefined,
    expiresAt: data.expires_at ? Date.parse(data.expires_at) : undefined,
  };

  if (provider !== "google_drive" && provider !== "dropbox") {
    return token;
  }

  const now = Date.now();
  const expiresSoon = !token.expiresAt || token.expiresAt <= now + REFRESH_WINDOW_MS;
  const hasLegacyExpiry =
    !!token.expiresAt && token.expiresAt > now + LEGACY_EXPIRY_THRESHOLD_MS;

  if (!expiresSoon && !hasLegacyExpiry) {
    return token;
  }

  if (!token.refreshToken) {
    throw new Error(
      `${provider === "google_drive" ? "Google Drive" : "Dropbox"} access has expired. Please reconnect the integration.`,
    );
  }

  const refreshed = await refreshIntegrationToken(provider, token.refreshToken);
  const refreshToken = refreshed.refreshToken ?? token.refreshToken;

  await upsertIntegrationToken({
    userId: user.id,
    provider,
    accessToken: refreshed.accessToken,
    refreshToken,
    expiresAt: refreshed.expiresAt,
  });

  return {
    provider,
    accessToken: refreshed.accessToken,
    refreshToken,
    expiresAt: refreshed.expiresAt,
  };
}

async function refreshIntegrationToken(
  provider: "google_drive" | "dropbox",
  refreshToken: string,
) {
  const isGoogle = provider === "google_drive";
  const clientId = isGoogle
    ? process.env.GOOGLE_CLIENT_ID
    : process.env.DROPBOX_CLIENT_ID;
  const clientSecret = isGoogle
    ? process.env.GOOGLE_CLIENT_SECRET
    : process.env.DROPBOX_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(`Missing ${isGoogle ? "Google Drive" : "Dropbox"} OAuth configuration.`);
  }

  const response = await fetch(
    isGoogle
      ? "https://oauth2.googleapis.com/token"
      : "https://api.dropboxapi.com/oauth2/token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    },
  );

  const payload = (await response.json().catch(() => null)) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    error_description?: string;
  } | null;

  if (!response.ok || !payload?.access_token) {
    throw new Error(
      payload?.error_description ||
        `Unable to refresh ${isGoogle ? "Google Drive" : "Dropbox"} access. Please reconnect the integration.`,
    );
  }

  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token,
    expiresAt: Date.now() + (payload.expires_in ?? 3600) * 1000,
  };
}
