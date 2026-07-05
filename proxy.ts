import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

type RateLimitConfig = {
  readonly limit: number;
  readonly windowMs: number;
};

type RateLimitRecord = {
  count: number;
  resetAt: number;
};

const rateLimitStore = new Map<string, RateLimitRecord>();

const defaultApiRateLimit: RateLimitConfig = {
  limit: 120,
  windowMs: 60_000,
};

const apiRateLimits: ReadonlyArray<{
  readonly prefix: string;
  readonly config: RateLimitConfig;
}> = [
  { prefix: "/api/ai", config: { limit: 20, windowMs: 60_000 } },
  { prefix: "/api/credits", config: { limit: 30, windowMs: 60_000 } },
  { prefix: "/api/integrations", config: { limit: 90, windowMs: 60_000 } },
  { prefix: "/api/account/request-deletion-code", config: { limit: 5, windowMs: 60_000 } },
  { prefix: "/api/billing/checkout", config: { limit: 15, windowMs: 60_000 } },
];

const rateLimitBypassPrefixes = [
  "/api/billing/webhooks",
  "/api/auth/callback",
  "/api/integrations/google-drive/callback",
  "/api/integrations/dropbox/callback",
];

export async function proxy(request: NextRequest) {
  // Clone the request headers for the Supabase client
  const cookieStore = await cookies();
  const requestUrl = new URL(request.url);
  const pathname = requestUrl.pathname;

  if (pathname.startsWith("/api/")) {
    const rateLimitResponse = applyApiRateLimit(request, pathname);

    if (rateLimitResponse) {
      return rateLimitResponse;
    }
  }

  // Only validate protected routes
  const protectedPaths = ["/home", "/canvas"];
  const isProtectedRoute = protectedPaths.some((path) =>
    pathname.startsWith(path),
  );

  if (!isProtectedRoute) {
    return withSecurityHeaders(NextResponse.next({
      request: {
        headers: request.headers,
      },
    }));
  }

  // Create a Supabase client with the cookies from the request
  const supabaseClient = createServerClient(
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

  const {
    data: { user },
    error: userError,
  } = await supabaseClient.auth.getUser();

  if (userError || !user) {
    return withSecurityHeaders(NextResponse.redirect(new URL("/signin", request.url)));
  }

  return withSecurityHeaders(NextResponse.next({
    request: {
      headers: request.headers,
    },
  }));
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};

function applyApiRateLimit(
  request: NextRequest,
  pathname: string,
): NextResponse | null {
  if (rateLimitBypassPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    return null;
  }

  const config =
    apiRateLimits.find(({ prefix }) => pathname.startsWith(prefix))?.config ??
    defaultApiRateLimit;
  const clientIp = getClientIp(request);
  const key = `${clientIp}:${pathname}`;
  const now = Date.now();
  const existing = rateLimitStore.get(key);

  pruneExpiredRateLimits(now);

  if (!existing || existing.resetAt <= now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + config.windowMs });
    return null;
  }

  existing.count += 1;

  if (existing.count <= config.limit) {
    return null;
  }

  const retryAfterSeconds = Math.max(
    1,
    Math.ceil((existing.resetAt - now) / 1000),
  );

  return withSecurityHeaders(NextResponse.json(
    { error: "Too many requests" },
    {
      status: 429,
      headers: {
        "Cache-Control": "no-store",
        "Retry-After": retryAfterSeconds.toString(),
        "X-RateLimit-Limit": config.limit.toString(),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": Math.ceil(existing.resetAt / 1000).toString(),
      },
    },
  ));
}

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

function pruneExpiredRateLimits(now: number): void {
  if (rateLimitStore.size < 5_000) {
    return;
  }

  for (const [key, record] of rateLimitStore) {
    if (record.resetAt <= now) {
      rateLimitStore.delete(key);
    }
  }
}

function withSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), geolocation=(), microphone=()");
  response.headers.set("Vary", "Accept-Encoding");

  return response;
}
