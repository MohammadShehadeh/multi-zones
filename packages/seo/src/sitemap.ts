import type { MetadataRoute } from "next";
import { locales } from "@repo/i18n/config";
import { BASE_URL } from "./constants";

interface SitemapEntry {
  path: string;
  lastModified?: Date | string;
  changeFrequency?:
    | "always"
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly"
    | "never";
  priority?: number;
}

export function buildSitemap(entries: SitemapEntry[]): MetadataRoute.Sitemap {
  return entries.flatMap((entry) =>
    locales.map((locale) => ({
      url: `${BASE_URL}/${locale}${entry.path}`,
      lastModified: entry.lastModified,
      changeFrequency: entry.changeFrequency,
      priority: entry.priority,
      alternates: {
        languages: Object.fromEntries(
          locales.map((loc) => [loc, `${BASE_URL}/${loc}${entry.path}`])
        ),
      },
    }))
  );
}
