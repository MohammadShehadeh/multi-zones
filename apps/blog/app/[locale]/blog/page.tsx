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

  const posts = [
    { slug: "getting-started", title: "Getting Started with Multi-Zones" },
    { slug: "i18n-deep-dive", title: "Deep Dive into i18n with next-intl" },
  ];

  return (
    <div>
      <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: "8px", padding: "1rem", marginBottom: "1.5rem" }}>
        <p style={{ margin: 0, fontSize: "0.8rem", color: "#666" }}>Zone: <strong>blog</strong> · Port 3002 · Locale: <strong>{locale}</strong></p>
      </div>
      <Image src={`${process.env.NEXT_PUBLIC_ZONE_URL || "http://localhost:3002"}/blog-hero.svg`} alt="Blog zone" width={400} height={200} unoptimized style={{ borderRadius: "8px", marginBottom: "1.5rem" }} />
      <h1>{t("title")}</h1>
      <p>{t("description")}</p>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {posts.map((post) => (
          <li key={post.slug} style={{ marginBottom: "1rem", padding: "1rem", border: "1px solid #eee", borderRadius: "6px" }}>
            <a href={`/${locale}/blog/${post.slug}`}>{post.title}</a>
          </li>
        ))}
      </ul>
      <hr />
      <p style={{ fontSize: "0.85rem", color: "#666" }}>
        Demo: <a href="/blog/api/posts" target="_blank">/blog/api/posts</a> (no locale in URL)
      </p>
    </div>
  );
}
