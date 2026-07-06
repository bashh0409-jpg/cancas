import { NextRequest, NextResponse } from "next/server";

const MARKETING_HOSTS = new Set(["swipes.site", "www.swipes.site"]);
const APP_HOST = "app.swipes.site";

const APP_ROUTE_PREFIXES = [
  "/auth",
  "/billing",
  "/canvas",
  "/home",
  "/signin",
  "/notfound",
];

const APP_API_PREFIXES = [
  "/api/account",
  "/api/auth",
  "/api/billing",
  "/api/canvases",
  "/api/credits",
  "/api/integrations",
];

function isAppRoute(pathname: string) {
  return [...APP_ROUTE_PREFIXES, ...APP_API_PREFIXES].some((prefix) => {
    return pathname === prefix || pathname.startsWith(`${prefix}/`);
  });
}

function withHost(request: NextRequest, host: string) {
  const url = request.nextUrl.clone();
  url.hostname = host;
  url.port = "";
  url.protocol = "https:";
  return url;
}

export function middleware(request: NextRequest) {
  const hostname = request.nextUrl.hostname;
  const pathname = request.nextUrl.pathname;

  if (hostname === APP_HOST && pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/home";
    return NextResponse.rewrite(url);
  }

  if (MARKETING_HOSTS.has(hostname) && isAppRoute(pathname)) {
    return NextResponse.redirect(withHost(request, APP_HOST));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)",
  ],
};
