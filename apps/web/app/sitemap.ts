import { buildSitemap } from "@repo/seo/sitemap";

export default function sitemap() {
  return buildSitemap([
    { path: "", changeFrequency: "daily", priority: 1.0 },
    { path: "/about", changeFrequency: "monthly", priority: 0.8 },
  ]);
}
