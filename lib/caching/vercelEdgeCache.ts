/**
 * Vercel Edge Cache Strategy Configuration
 * Presets for cache headers applied to different route types
 * 
 * Rules:
 * - ✅ Cache: Public static data (pricing, templates, AI metadata, currency, flags)
 * - ❌ Never Cache: Authenticated/private data (accounts, canvas, real-time)
 */

export type CacheStrategy =
  | "PUBLIC_PRICING"
  | "PUBLIC_TEMPLATES"
  | "AI_METADATA"
  | "CURRENCY_RATES"
  | "FEATURE_FLAGS"
  | "NO_CACHE_AUTH"
  | "NO_CACHE_CANVAS"
  | "NO_CACHE_USER_DATA"
  | "NO_CACHE_GENERAL";

/**
 * Cache Control header presets for different data types
 */
export const CACHE_PRESETS: Record<CacheStrategy, string> = {
  // Public cacheable data
  PUBLIC_PRICING: "public, max-age=3600, stale-while-revalidate=86400",
  PUBLIC_TEMPLATES: "public, max-age=1800, stale-while-revalidate=604800",
  AI_METADATA: "public, max-age=86400, stale-while-revalidate=604800",
  CURRENCY_RATES: "public, max-age=300, stale-while-revalidate=3600",
  FEATURE_FLAGS: "public, max-age=60, stale-while-revalidate=3600",

  // Private data - never cache
  NO_CACHE_AUTH: "private, no-cache, no-store, must-revalidate",
  NO_CACHE_CANVAS: "private, no-cache, no-store, must-revalidate",
  NO_CACHE_USER_DATA: "private, no-cache, no-store, must-revalidate",
  NO_CACHE_GENERAL: "private, no-cache, no-store, must-revalidate",
};

/**
 * Map routes to their cache strategies
 * Determines if a route should be cached or not
 */
function getPublicRouteStrategy(pathname: string): CacheStrategy | null {
  // Pricing and billing - public cacheable
  if (pathname === "/api/billing/pricing" || pathname.startsWith("/api/billing/pricing/")) {
    return "PUBLIC_PRICING";
  }

  // Currency conversion - frequently updated but still cacheable
  if (pathname === "/api/currency" || pathname.startsWith("/api/currency/")) {
    return "CURRENCY_RATES";
  }

  // Feature flags - low-frequency updates
  if (pathname === "/api/features" || pathname.startsWith("/api/features/")) {
    return "FEATURE_FLAGS";
  }

  // Admin panel data - check auth separately
  if (pathname.startsWith("/api/admin/")) {
    return null; // Will be treated as authenticated-only
  }

  return null;
}

/**
 * Determine cache strategy based on route and authentication status
 * Returns the appropriate cache control preset
 */
export function getCacheStrategy(
  pathname: string,
  isAuthenticated: boolean,
): CacheStrategy {
  // Check if this is a public route that can be cached
  const publicStrategy = getPublicRouteStrategy(pathname);
  if (publicStrategy && !isAuthenticated) {
    return publicStrategy;
  }

  // Private authenticated routes - never cache
  if (pathname.startsWith("/api/account/")) {
    return "NO_CACHE_USER_DATA";
  }

  if (pathname.startsWith("/api/auth/")) {
    return "NO_CACHE_AUTH";
  }

  if (pathname.startsWith("/api/canvases/")) {
    return "NO_CACHE_CANVAS";
  }

  // Canvas-related private routes
  if (pathname.startsWith("/api/credits/")) {
    return "NO_CACHE_USER_DATA";
  }

  if (pathname.startsWith("/api/integrations/")) {
    return "NO_CACHE_USER_DATA";
  }

  // Reader API (private)
  if (pathname.startsWith("/api/reader/")) {
    return "NO_CACHE_CANVAS";
  }

  // Default: if authenticated, no cache; if not, default no-cache
  // This is conservative - better to not cache than accidentally serve private data
  return "NO_CACHE_GENERAL";
}

/**
 * Utility to check if a strategy is cacheable
 */
export function isCacheable(strategy: CacheStrategy): boolean {
  return !strategy.startsWith("NO_CACHE");
}

/**
 * Extract max-age seconds from a Cache-Control header string
 */
export function extractMaxAge(cacheControl: string): number | null {
  const match = cacheControl.match(/max-age=(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Extract stale-while-revalidate seconds from a Cache-Control header string
 */
export function extractStaleWhileRevalidate(cacheControl: string): number | null {
  const match = cacheControl.match(/stale-while-revalidate=(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}
