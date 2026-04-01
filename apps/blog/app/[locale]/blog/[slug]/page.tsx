import { setRequestLocale } from "next-intl/server";
import { buildMetadata } from "@repo/seo/metadata";
import { articleJsonLd } from "@repo/seo/json-ld";
import type { Locale } from "@repo/i18n/config";

async function getPost(slug: string, locale: string) {
  return {
    title: "My Blog Post",
    description: "A great blog post",
    content: "<p>Hello world</p>",
    publishedTime: "2026-03-15T00:00:00Z",
    authors: ["Mohammad"],
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const post = await getPost(slug, locale);

  return buildMetadata({
    locale: locale as Locale,
    title: post.title,
    description: post.description,
    path: `/blog/${slug}`,
    type: "article",
    publishedTime: post.publishedTime,
    authors: post.authors,
  });
}

export default async function BlogPost({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const post = await getPost(slug, locale);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            articleJsonLd({
              locale: locale as Locale,
              title: post.title,
              description: post.description,
              path: `/blog/${slug}`,
              publishedTime: post.publishedTime,
              authors: post.authors,
            })
          ),
        }}
      />
      <article>
        <h1>{post.title}</h1>
        <div dangerouslySetInnerHTML={{ __html: post.content }} />
      </article>
    </>
  );
}
