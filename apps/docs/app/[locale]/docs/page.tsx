import Image from "next/image";
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
    <div>
      <div style={{ background: "#fdf4ff", border: "1px solid #e879f9", borderRadius: "8px", padding: "1rem", marginBottom: "1.5rem" }}>
        <p style={{ margin: 0, fontSize: "0.8rem", color: "#666" }}>Zone: <strong>docs</strong> · Port 3001 · Locale: <strong>{locale}</strong></p>
      </div>
      <Image src={`${process.env.NEXT_PUBLIC_ZONE_URL || "http://localhost:3001"}/docs-hero.svg`} alt="Docs zone" width={400} height={200} unoptimized style={{ borderRadius: "8px", marginBottom: "1.5rem" }} />
      <h1>{t("title")}</h1>
      <p>{t("description")}</p>
      <ul>
        <li><a href={`/${locale}/docs/getting-started`}>Getting Started</a></li>
        <li><a href={`/${locale}/docs/api-reference`}>API Reference</a></li>
      </ul>
      <hr />
      <p style={{ fontSize: "0.85rem", color: "#666" }}>
        Demo: <a href="/docs/api/health" target="_blank">/docs/api/health</a> (no locale in URL)
      </p>
    </div>
  );
}
