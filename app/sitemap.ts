import type { MetadataRoute } from "next";

// Configurar NEXT_PUBLIC_SITE_URL en .env.local / la plataforma de deploy con el dominio real.
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  // "/" y "/login" son noindex (ver metadata.robots en sus respectivos page.tsx) — no van acá.
  const routes = ["/calendario", "/nutricion", "/estadisticas"];

  return routes.map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(),
  }));
}
