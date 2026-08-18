import type { MetadataRoute } from "next";

const BASE_URL = "https://swipes.site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/canvas/", "/dashboard/"],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}