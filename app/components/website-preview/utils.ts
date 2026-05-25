export type WebsiteLinkMeta = {
  url: string;
  title: string;
  hostname: string;
  path: string;
};

export function parseWebsiteUrl(url: string): WebsiteLinkMeta {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.replace(/^www\./, "");

    return {
      url,
      title: hostname,
      hostname,
      path: parsed.pathname === "/" ? "" : parsed.pathname,
    };
  } catch {
    return {
      url,
      title: "Website",
      hostname: "link",
      path: "",
    };
  }
}

export function getHostnameHue(hostname: string) {
  let hash = 0;

  for (let index = 0; index < hostname.length; index += 1) {
    hash = hostname.charCodeAt(index) + ((hash << 5) - hash);
  }

  return Math.abs(hash) % 360;
}

export function getPreviewGradient(hostname: string) {
  const hue = getHostnameHue(hostname);

  return `linear-gradient(145deg, hsl(${hue} 42% 88%) 0%, hsl(${(hue + 38) % 360} 36% 78%) 48%, hsl(${(hue + 72) % 360} 28% 68%) 100%)`;
}
