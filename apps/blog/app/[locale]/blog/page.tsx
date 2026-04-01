import { setRequestLocale, getTranslations } from "next-intl/server";
import { buildMetadata } from "@repo/seo/metadata";
import type { Locale } from "@repo/i18n/config";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return buildMetadata({
    locale: locale as Locale,
    title: "Blog",
    description: "Read our latest posts",
    path: "/blog",
  });
}

export default async function BlogIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("blog");

  return (
    <div>
      <h1>{t("title")}</h1>
      <p>{t("description")}</p>
    </div>
  );
}
