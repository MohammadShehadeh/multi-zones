import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");

  return (
    <div style={{ padding: "2rem" }}>
      <div style={{ background: "#e8f4fd", border: "1px solid #90caf9", borderRadius: "8px", padding: "1.5rem", marginBottom: "1.5rem" }}>
        <p style={{ margin: 0, fontSize: "0.8rem", color: "#666" }}>Zone: <strong>web (main)</strong> · Port 3000 · Locale: <strong>{locale}</strong></p>
      </div>
      <Image src="/web-hero.svg" alt="Web zone" width={400} height={200} style={{ borderRadius: "8px", marginBottom: "1.5rem" }} />
      <h1>{t("title")}</h1>
      <p>{t("description")}</p>
      <div style={{ marginTop: "1.5rem", display: "flex", gap: "1rem" }}>
        <a href={`/${locale}/docs`} style={{ padding: "0.5rem 1rem", background: "#4f46e5", color: "white", borderRadius: "6px", textDecoration: "none" }}>Go to Docs →</a>
        <a href={`/${locale}/blog`} style={{ padding: "0.5rem 1rem", background: "#059669", color: "white", borderRadius: "6px", textDecoration: "none" }}>Go to Blog →</a>
      </div>
    </div>
  );
}
