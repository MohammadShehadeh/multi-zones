import { setRequestLocale, getMessages } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import { notFound } from "next/navigation";
import { locales, isRtl, type Locale } from "@repo/i18n/config";
import { Button } from "./button";
import { Link } from "@repo/microfrontends/next/client";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function DocsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) notFound();
  setRequestLocale(locale);

  const messages = await getMessages();

  return (
    <html lang={locale} dir={isRtl(locale as Locale) ? "rtl" : "ltr"}>
      <body style={{ margin: 0, fontFamily: "sans-serif" }}>
        <NextIntlClientProvider messages={messages}>
          <nav style={{ display: "flex", gap: "1rem", padding: "1rem", borderBottom: "1px solid #eee", background: "#fdf4ff" }}>
            <Link href={`/${locale}`}>🏠 Home</Link>
            <Link href={`/${locale}/docs`} style={{ fontWeight: "bold" }}>📖 Docs</Link>
            <Link href={`/${locale}/blog`}>✍️ Blog</Link>
            <span style={{ marginLeft: "auto" }}>
              {locales.map((l) => (
                <Link key={l} href={`/${l}/docs`} style={{ marginLeft: "0.5rem", fontWeight: l === locale ? "bold" : "normal" }}>
                  {l.toUpperCase()}
                </Link>
              ))}
            </span>
          </nav>
          <div style={{ display: "flex" }}>
            <aside style={{ width: "200px", padding: "1rem", borderRight: "1px solid #eee", minHeight: "100vh" }}>
              <p style={{ fontWeight: "bold", marginTop: 0 }}>Contents</p>
              <ul style={{ listStyle: "none", padding: 0 }}>
                <li><Link href={`/${locale}/docs`}>Overview</Link></li>
                <li><Link href={`/${locale}/docs/getting-started`}>Getting Started</Link></li>
                <li><Link href={`/${locale}/docs/api-reference`}>API Reference</Link></li>
              </ul>
              <hr />
              <p style={{ fontSize: "0.75rem", color: "#999" }}>Zone: docs · Port 3001</p>
            </aside>
            <main style={{ padding: "2rem", flex: 1 }}>{children} <Button /></main>
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
