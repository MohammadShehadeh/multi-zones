import { BASE_URL, SITE_NAME } from "./constants";
import type { Locale } from "@repo/i18n/config";

interface ArticleJsonLdProps {
  locale: Locale;
  title: string;
  description: string;
  path: string;
  publishedTime: string;
  modifiedTime?: string;
  authors: string[];
  image?: string;
}

export function articleJsonLd({
  locale,
  title,
  description,
  path,
  publishedTime,
  modifiedTime,
  authors,
  image,
}: ArticleJsonLdProps) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    url: `${BASE_URL}/${locale}${path}`,
    datePublished: publishedTime,
    dateModified: modifiedTime || publishedTime,
    author: authors.map((name) => ({ "@type": "Person", name })),
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: BASE_URL,
    },
    inLanguage: locale,
    ...(image && { image }),
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: BASE_URL,
  };
}
