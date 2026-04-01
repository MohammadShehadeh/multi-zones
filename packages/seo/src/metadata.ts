import type { Metadata } from "next";
import { locales, type Locale, isRtl } from "@repo/i18n/config";
import { BASE_URL, DEFAULT_OG_IMAGE, SITE_NAME } from "./constants";

interface BuildMetadataParams {
  locale: Locale;
  title: string;
  description: string;
  path: string;
  ogImage?: string;
  noIndex?: boolean;
  type?: "website" | "article";
  publishedTime?: string;
  authors?: string[];
}

export function buildMetadata({
  locale,
  title,
  description,
  path,
  ogImage,
  noIndex = false,
  type = "website",
  publishedTime,
  authors,
}: BuildMetadataParams): Metadata {
  const url = `${BASE_URL}/${locale}${path}`;
  const image = ogImage || DEFAULT_OG_IMAGE;
  const dir = isRtl(locale) ? "rtl" : "ltr";

  const languages: Record<string, string> = {};
  for (const loc of locales) {
    languages[loc] = `${BASE_URL}/${loc}${path}`;
  }
  languages["x-default"] = `${BASE_URL}/en${path}`;

  return {
    title: {
      default: title,
      template: `%s | ${SITE_NAME}`,
    },
    description,
    metadataBase: new URL(BASE_URL),
    alternates: {
      canonical: url,
      languages,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      images: [{ url: image, width: 1200, height: 630 }],
      locale,
      type,
      ...(type === "article" && { publishedTime, authors }),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
    other: {
      dir,
    },
  };
}
