import { buildSitemap } from "@repo/seo/sitemap";

export default function sitemap() {
  return buildSitemap([
    { path: "/docs", priority: 0.9 },
    { path: "/docs/getting-started", priority: 0.8 },
    { path: "/docs/api-reference", priority: 0.8 },
  ]);
}
