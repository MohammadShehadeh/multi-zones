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
    title: "Documentation",
    description: "Browse our documentation",
    path: "/docs",
  });
}

export default async function DocsIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("docs");

  return (
    <main>
      <h1>{t("title")}</h1>
      <p>{t("description")}</p>
    </main>
  );
}
