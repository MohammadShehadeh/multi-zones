import { setRequestLocale } from "next-intl/server";
import { buildMetadata } from "@repo/seo/metadata";
import type { Locale } from "@repo/i18n/config";

async function getDoc(slug: string[], locale: string) {
  const path = slug.join("/");
  return {
    title: `Doc: ${path}`,
    description: `Documentation for ${path}`,
    content: `<p>Content for ${path}</p>`,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string[] }>;
}) {
  const { locale, slug } = await params;
  const doc = await getDoc(slug, locale);

  return buildMetadata({
    locale: locale as Locale,
    title: doc.title,
    description: doc.description,
    path: `/docs/${slug.join("/")}`,
  });
}

export default async function DocPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string[] }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const doc = await getDoc(slug, locale);

  return (
    <article>
      <h1>{doc.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: doc.content }} />
    </article>
  );
}
