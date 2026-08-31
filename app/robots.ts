import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// Netlify sets CONTEXT to "production" only for the production deploy —
// branch/PR deploy previews get "deploy-preview" or "branch-deploy".
// See research.md Decision 9.
const isProduction = process.env.CONTEXT === "production";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: isProduction ? "/" : undefined,
      disallow: isProduction ? undefined : "/",
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
