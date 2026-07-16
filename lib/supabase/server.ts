import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
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

/**
 * Safely retrieve the authenticated user, handling stale session tokens without crashing.
 *
 * The Supabase SSR client stores refresh tokens in cookies. When a refresh token
 * has already been consumed or is invalid (e.g. after OAuth re-authentication,
 * manual session invalidation, or cross-device sign-in), `getUser()` throws
 * with `refresh_token_not_found`. This wrapper:
 *
 * 1. Catches the error
 * 2. Clears all stale Supabase auth cookies so the next request doesn't repeat the failure
 * 3. Returns `null` so callers redirect to sign-in gracefully
 *
 * @returns The authenticated user, or `null` if not authenticated or session is stale.
 */
export async function getAuthenticatedUser(
  supabase: SupabaseClient,
): Promise<import("@supabase/supabase-js").User | null> {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data.user;
  } catch (err: unknown) {
    const authError = err as {
      status?: number;
      code?: string;
      message?: string;
    };

    const isRefreshTokenError =
      authError?.code === "refresh_token_not_found" ||
      authError?.status === 400 ||
      (typeof authError?.message === "string" &&
        (authError.message.includes("refresh_token_not_found") ||
          authError.message.includes("Invalid Refresh Token")));

    if (isRefreshTokenError) {
      try {
        const cookieStore = await cookies();
        const staleCookies = cookieStore
          .getAll()
          .filter(
            (c) =>
              c.name.startsWith("sb-") ||
              c.name.includes("supabase-auth-token") ||
              c.name.startsWith("supabase-"),
          );

        for (const cookie of staleCookies) {
          cookieStore.set(cookie.name, "", {
            maxAge: 0,
            path: "/",
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
          });
        }

        console.warn(
          `[Auth] Cleared ${staleCookies.length} stale session cookie(s) due to ${authError.code ?? authError.message}`,
        );
      } catch {
        // Cookie clearing is best-effort; the redirect to sign-in is the main recovery
      }
    } else {
      // Log non-refresh auth errors (e.g. network failures) but don't crash
      console.warn(
        `[Auth] getUser() failed (non-refresh): ${authError?.message ?? "unknown"}`,
      );
    }

    return null;
  }
}