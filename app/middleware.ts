/**
 * Middleware for session refresh + automatic cache header management
 * - Refreshes the Supabase session on page routes so tokens rotate correctly
 *   (Server Components can't persist cookies themselves — this is the only
 *   place in the request lifecycle allowed to do it).
 * - Routes public API data to Edge cache, prevents caching of authenticated/private data.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getCacheStrategy, CACHE_PRESETS } from "@/lib/caching/vercelEdgeCache";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static assets, public files, fonts, images
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/ingest") ||
    pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|webp|avif)$/)
  ) {
    return NextResponse.next();
  }

  // ── Session refresh (runs on every non-static, non-API request) ────────
  // This is what keeps users signed in. Supabase rotates the access +
  // refresh token pair here, and — because this is middleware, not a
  // Server Component — the rotated cookies actually persist to the browser.
  let response = NextResponse.next({ request });

  if (!pathname.startsWith("/api")) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value),
            );
            response = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, {
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

    // Calling getUser() here is what actually triggers the refresh when
    // the access token is expired. We don't need the result — just the
    // side effect of rotated cookies landing on `response`.
    await supabase.auth.getUser();
  }

  // ── API cache-header logic (unchanged from before) ──────────────────────
  if (!pathname.startsWith("/api")) {
    return response;
  }

  const authCookie =
    request.cookies.get("sb-auth-token")?.value ||
    request.cookies.get("sb-access-token")?.value;
  const isAuthenticated = !!authCookie;

  const strategy = getCacheStrategy(pathname, isAuthenticated);
  const cacheControl = CACHE_PRESETS[strategy];
  response.headers.set("Cache-Control", cacheControl);
  response.headers.set("X-Middleware-Cache-Strategy", strategy);

  if (isAuthenticated || strategy.startsWith("NO_CACHE")) {
    response.headers.set("Vary", "Authorization");
  } else {
    response.headers.set("Vary", "Accept-Encoding");
  }

  if (strategy !== "NO_CACHE_AUTH" && !strategy.startsWith("NO_CACHE")) {
    const maxAge = extractMaxAge(cacheControl);
    if (maxAge) {
      response.headers.set("CDN-Cache-Control", `public, max-age=${maxAge}`);
    }
  }

  return response;
}

function extractMaxAge(cacheControl: string): number | null {
  const match = cacheControl.match(/max-age=(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

// Now runs on page routes too, not just /api — that's the actual fix.
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|woff|woff2|ttf|eot)$).*)",
  ],
};