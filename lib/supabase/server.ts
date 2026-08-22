import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

function isSupabaseAuthCookie(name: string) {
  return (
    name.startsWith("sb-") ||
    name.includes("supabase-auth-token") ||
    name.startsWith("supabase-")
  );
}

export function clearSupabaseAuthCookies(
  response: NextResponse,
  request?: NextRequest,
) {
  const cookieNames = new Set<string>();

  if (request) {
    for (const cookie of request.cookies.getAll()) {
      if (isSupabaseAuthCookie(cookie.name)) {
        cookieNames.add(cookie.name);
      }
    }
  }

  for (const name of cookieNames) {
    response.cookies.set(name, "", {
      maxAge: 0,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }
}

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, {
              ...options,
              maxAge: options?.maxAge ?? 60 * 60 * 24 * 365,
              sameSite: options?.sameSite ?? "lax",
              secure: process.env.NODE_ENV === "production",
              path: options?.path ?? "/",
            }),
          );
        },
      },
    },
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const AUTH_REQUEST_TIMEOUT_MS = 8000;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(
        () => reject(new Error("Supabase auth request timed out")),
        timeoutMs,
      );
    }),
  ]);
}

/**
 * Decode a JWT payload (base64url) without signature verification.
 * Only used to check the `exp` claim — we never trust unverified tokens for auth.
 */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1];
    // Base64url → standard base64
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "=",
    );
    const decoded = atob(padded);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

/**
 * Get the Supabase auth cookie name for the current project.
 * Supabase SSR stores tokens in `sb-<project-ref>-auth-token`.
 * We fall back to scanning all cookies for a matching pattern.
 */
function getSupabaseAuthCookieName(cookiesList: { name: string; value: string }[]): string | null {
  // First, look for the common pattern
  const authCookie = cookiesList.find(
    (c) =>
      c.name.startsWith("sb-") &&
      c.name.endsWith("-auth-token"),
  );
  if (authCookie) return authCookie.name;

  // Fallback: scan for any superset auth cookie
  const fallback = cookiesList.find(
    (c) =>
      c.name.includes("supabase-auth-token") ||
      (c.name.startsWith("sb-") && !c.name.includes("-csrf-token")),
  );
  return fallback?.name ?? null;
}

/**
 * Read the access token from the Supabase auth cookie synchronously.
 * The cookie store must be passed in from the request context.
 */
function parseAccessTokenFromCookies(
  cookieStore: { name: string; value: string }[],
): string | null {
  try {
    const cookieName = getSupabaseAuthCookieName(cookieStore);
    if (!cookieName) return null;

    const cookie = cookieStore.find((c) => c.name === cookieName);
    if (!cookie?.value) return null;

    // Supabase SSR stores the session as a base64-encoded JSON array:
    // [access_token, refresh_token, user, ...]
    const decoded = atob(cookie.value);
    const parts = JSON.parse(decoded);
    if (Array.isArray(parts) && parts.length >= 1 && typeof parts[0] === "string") {
      return parts[0]; // access token
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Check whether the access token JWT has expired by examining its `exp`
 * claim. Returns `true` if expired or unreadable.
 *
 * We add a 30-second buffer to avoid edge-of-expiry races where a token
 * appears valid but expires between the check and the `getUser()` call.
 */
function isTokenExpired(accessToken: string): boolean {
  const payload = decodeJwtPayload(accessToken);
  if (!payload || typeof payload.exp !== "number") return true;

  const expBuffer = 30_000; // 30 seconds buffer
  const now = Date.now();
  return payload.exp * 1000 - expBuffer <= now;
}

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Get the session user using `getSession()` — a lighter check that reads the
 * session cookie without attempting a token refresh.
 *
 * Use this for routes that only need to confirm a user is logged in but don't
 * need a verified token (e.g. preference reads, non-critical checks).
 *
 * @returns The user from the session, or `null` if not logged in.
 */
export async function getSessionUser(
  supabase: SupabaseClient,
): Promise<User | null> {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session?.user ?? null;
  } catch {
    return null;
  }
}

/**
 * Safely retrieve the authenticated user, handling stale session tokens
 * and concurrent request races without crashing.
 *
 * ## The Problem
 *
 * The Supabase SSR client stores refresh tokens in cookies. When multiple
 * Vercel serverless function invocations race to refresh the same expired
 * token, the first one succeeds and rotates the token; the rest get
 * `refresh_token_already_used`.
 *
 * ## The Fix (three layers)
 *
 * 1. **Pre-check token expiry** — Before calling `getUser()`, decode the
 *    access token JWT from the auth cookie. If it's still valid (not expired),
 *    `getUser()` won't trigger a refresh at all, eliminating the race.
 *
 * 2. **Exponential backoff retry** — If a refresh IS needed and we hit the
 *    race condition, retry with backoff (100ms, 200ms, 400ms). By the third
 *    retry, the winning request's new session cookies will have propagated.
 *
 * 3. **Session fallback** — If all retries fail, try `getSession()` which
 *    reads the session from the (possibly stale) cookie without triggering
 *    another refresh. This works if the winning request stored the user in
 *    the cookie before the refresh race.
 *
 * @returns The authenticated user, or `null` if not authenticated or session is stale.
 */
export async function getAuthenticatedUser(
  supabase: SupabaseClient,
): Promise<User | null> {
  // ── Layer 1: If the access token is still valid, avoid a refresh entirely ──
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  const accessToken = parseAccessTokenFromCookies(allCookies);
  const hasAuthCookie = allCookies.some((cookie) =>
    isSupabaseAuthCookie(cookie.name),
  );

  if (!hasAuthCookie) {
    return null;
  }

  if (accessToken && !isTokenExpired(accessToken)) {
    // Token hasn't expired — getUser() won't trigger a refresh
    try {
      const { data, error } = await withTimeout(
        supabase.auth.getUser(),
        AUTH_REQUEST_TIMEOUT_MS,
      );
      if (!error && data.user) return data.user;

      // If getUser() fails despite a valid-looking token (e.g. revoked),
      // fall through to the full retry logic below.
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        error.message === "Supabase auth request timed out"
      ) {
        return null;
      }

      // Fall through
    }
  }

  // ── Layer 2: Token is expired/missing — retry with exponential backoff ──
  const MAX_RETRIES = 3;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const { data, error } = await withTimeout(
        supabase.auth.getUser(),
        AUTH_REQUEST_TIMEOUT_MS,
      );
      if (error) throw error;
      if (data.user) return data.user;
      // No error but no user either — session may be missing entirely
      return null;
    } catch (err: unknown) {
      const authError = err as {
        status?: number;
        code?: string;
        message?: string;
      };

      const errorCode = authError?.code ?? "";
      const errorMessage = authError?.message ?? "";

      const isAlreadyUsed =
        errorCode === "refresh_token_already_used" ||
        errorMessage.includes("refresh_token_already_used");

      const isRefreshError =
        isAlreadyUsed ||
        errorCode === "refresh_token_not_found" ||
        authError?.status === 400 ||
        errorMessage.includes("refresh_token_not_found") ||
        errorMessage.includes("Invalid Refresh Token");

      if (isAlreadyUsed && attempt < MAX_RETRIES) {
        // Race condition: another request consumed the token first.
        // Wait longer each attempt (100ms, 200ms, 400ms) for the new cookies.
        const delay = 100 * Math.pow(2, attempt);
        console.warn(
          `[Auth] refresh_token_already_used — retry ${attempt + 1}/${MAX_RETRIES} after ${delay}ms`,
        );
        await sleep(delay);
        continue;
      }

      if (isRefreshError) {
        // Non-retryable refresh error (not found, invalid) — clear stale cookies
        try {
          const staleCookies = cookieStore
            .getAll()
            .filter((c) => isSupabaseAuthCookie(c.name));

          for (const cookie of staleCookies) {
            cookieStore.set(cookie.name, "", {
              maxAge: 0,
              path: "/",
              sameSite: "lax",
              secure: process.env.NODE_ENV === "production",
            });
          }

          console.warn(
            `[Auth] Cleared ${staleCookies.length} stale session cookie(s) due to ${errorCode || errorMessage}`,
          );
        } catch {
          // Best-effort
        }

        // ── Layer 3: Fall back to getSession() ───────────────────────────
        // The session cookie may still have the user object even if the
        // refresh token is stale.
        try {
          const { data } = await supabase.auth.getSession();
          if (data.session?.user) {
            console.warn(`[Auth] Session fallback succeeded for user ${data.session.user.id}`);
            return data.session.user;
          }
        } catch {
          // Fall through to null
        }

        return null;
      }

      // Non-refresh error (network, etc.) — log and return null
      console.warn(
        `[Auth] getUser() failed (non-refresh): ${errorMessage || "unknown"}`,
      );
      return null;
    }
  }

  // Exhausted all retries — try session fallback one more time
  try {
    const { data } = await supabase.auth.getSession();
    if (data.session?.user) return data.session.user;
  } catch {
    // Silently fall through
  }

  return null;
}