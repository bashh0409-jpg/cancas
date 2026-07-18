const PRODUCTION_APP_ORIGIN = "https://www.swipes.site";

function normalizePath(path: string) {
  return path.startsWith("/") ? path : `/${path}`;
}

export function getAppUrl(path: string) {
  const normalizedPath = normalizePath(path);
  const configuredOrigin = process.env.NEXT_PUBLIC_APP_URL;

  if (configuredOrigin) {
    return `${configuredOrigin.replace(/\/$/, "")}${normalizedPath}`;
  }

  if (process.env.NODE_ENV === "production") {
    return `${PRODUCTION_APP_ORIGIN}${normalizedPath}`;
  }

  return normalizedPath;
}
