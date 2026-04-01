import { buildSitemap } from "@repo/seo/sitemap";

export default function sitemap() {
  return buildSitemap([
    { path: "/blog", priority: 0.9 },
    { path: "/blog/my-first-post", priority: 0.8 },
  ]);
}
