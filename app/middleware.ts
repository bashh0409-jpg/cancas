/**
 * Middleware for automatic cache header management
 * Routes public data to Edge cache, prevents caching of authenticated/private data
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
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

  // Only apply to API routes
  if (!pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // Determine if user is authenticated by checking for Supabase session cookie
  // Don't call auth.getSession() at the edge - it's too heavy and can fail
  const authCookie = request.cookies.get("sb-auth-token")?.value ||
    request.cookies.get("sb-access-token")?.value;
  const isAuthenticated = !!authCookie;

  // Determine cache strategy based on route + auth status
  const strategy = getCacheStrategy(pathname, isAuthenticated);

  const response = NextResponse.next();

  // Apply the determined cache control header
  response.headers.set("Cache-Control", CACHE_PRESETS[strategy]);

  // For authenticated routes, also set Vary to ensure no accidental caching
  if (isAuthenticated || strategy.startsWith("NO_CACHE")) {
    response.headers.set("Vary", "Authorization");
  } else {
    response.headers.set("Vary", "Accept-Encoding");
  }

  // Set CDN-Cache-Control for public cacheable routes to instruct Vercel/Cloudflare CDN
  if (strategy !== "NO_CACHE_AUTH" && !strategy.startsWith("NO_CACHE")) {
    const maxAge = extractMaxAge(CACHE_PRESETS[strategy]);
    if (maxAge) {
      response.headers.set("CDN-Cache-Control", `public, max-age=${maxAge}`);
    }
  }

  return response;
}

/**
 * Extract max-age value from a Cache-Control header string
 */
function extractMaxAge(cacheControl: string): number | null {
  const match = cacheControl.match(/max-age=(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

// Configure which routes the middleware applies to
export const config = {
  matcher: ["/api/:path*", "/_next/static/:path*"],
};