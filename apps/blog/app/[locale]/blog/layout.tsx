import { setRequestLocale, getMessages } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import { notFound } from "next/navigation";
import { locales, isRtl, type Locale } from "@repo/i18n/config";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function BlogLayout({
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
          <nav style={{ display: "flex", gap: "1rem", padding: "1rem", borderBottom: "1px solid #eee", background: "#f0fdf4" }}>
            <a href={`/${locale}`}>🏠 Home</a>
            <a href={`/${locale}/docs`}>📖 Docs</a>
            <a href={`/${locale}/blog`} style={{ fontWeight: "bold" }}>✍️ Blog</a>
            <span style={{ marginLeft: "auto" }}>
              {locales.map((l) => (
                <a key={l} href={`/${l}/blog`} style={{ marginLeft: "0.5rem", fontWeight: l === locale ? "bold" : "normal" }}>
                  {l.toUpperCase()}
                </a>
              ))}
            </span>
          </nav>
          <main style={{ padding: "2rem" }}>{children}</main>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
