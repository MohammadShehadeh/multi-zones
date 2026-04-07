# Next.js Multi-Zones · Turborepo · i18n · SEO

## Target URL Structure

```
example.com/                    → main app (web)
example.com/en/about            → main app (web)
example.com/ar/about            → main app (web)
example.com/en/docs/getting-started → docs app (docs)
example.com/ar/docs/getting-started → docs app (docs)
example.com/en/blog/my-post     → blog app (blog)
example.com/ar/blog/my-post     → blog app (blog)
```

---

## 1. Monorepo Structure

```
root/
├── turbo.json
├── package.json
├── packages/
│   ├── ui/                     # Shared UI components
│   │   ├── src/
│   │   └── package.json
│   ├── i18n/                   # Shared i18n config & dictionaries
│   │   ├── src/
│   │   │   ├── config.ts
│   │   │   ├── middleware.ts   # Reusable locale detection logic
│   │   │   ├── navigation.ts  # Locale-aware Link, redirect, etc.
│   │   │   └── request.ts
│   │   ├── dictionaries/
│   │   │   ├── en/
│   │   │   │   ├── common.json
│   │   │   │   ├── docs.json
│   │   │   │   └── blog.json
│   │   │   └── ar/
│   │   │       ├── common.json
│   │   │       ├── docs.json
│   │   │       └── blog.json
│   │   └── package.json
│   ├── seo/                    # Shared SEO utilities
│   │   ├── src/
│   │   │   ├── metadata.ts     # Base metadata builder
│   │   │   ├── sitemap.ts      # Sitemap generation helpers
│   │   │   ├── json-ld.ts      # Structured data helpers
│   │   │   └── constants.ts    # BASE_URL, default OG, etc.
│   │   └── package.json
│   └── tsconfig/               # Shared TS configs
│       ├── base.json
│       ├── nextjs.json
│       └── react-package.json
├── apps/
│   ├── main/                   # Gateway app (port 3000)
│   ├── docs/                   # Docs zone   (port 3001)
│   └── blog/                   # Blog zone   (port 3002)
```

---

## 2. Turborepo Config

### `turbo.json`

```jsonc
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^lint"]
    }
  }
}
```

### Root `package.json`

```jsonc
{
  "private": true,
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint"
  },
  "devDependencies": {
    "turbo": "^2.x"
  },
  "packageManager": "pnpm@9.x"
}
```

### `pnpm-workspace.yaml`

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

---

## 3. Shared i18n Package

Using `next-intl` — the best App Router i18n library.

### `packages/i18n/src/config.ts`

```ts
export const locales = ["en", "ar"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const rtlLocales: Locale[] = ["ar"];

export function isRtl(locale: Locale): boolean {
  return rtlLocales.includes(locale);
}

// Zone path prefixes — used for rewrite matching & link generation
export const zones = {
  docs: "/docs",
  blog: "/blog",
} as const;
```

### `packages/i18n/src/middleware.ts`

```ts
import createMiddleware from "next-intl/middleware";
import { locales, defaultLocale } from "./config";

/**
 * Creates the next-intl middleware with shared config.
 * Each zone app calls this in its own middleware.ts
 */
export function createI18nMiddleware() {
  return createMiddleware({
    locales,
    defaultLocale,
    // "as-needed" → no prefix for default locale
    // "always"   → always prefix (recommended for SEO parity)
    localePrefix: "always",
    localeDetection: true,
  });
}
```

### `packages/i18n/src/navigation.ts`

```ts
import { createNavigation } from "next-intl/navigation";
import { locales, defaultLocale } from "./config";

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation({
    locales,
    defaultLocale,
    localePrefix: "always",
  });
```

### `packages/i18n/src/request.ts`

```ts
import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { locales, defaultLocale } from "./config";

/**
 * Factory: creates a getRequestConfig for a given zone.
 * Each zone calls this with its own dictionary namespace.
 *
 * @param zone - "main" | "docs" | "blog"
 */
export function createRequestConfig(zone: "main" | "docs" | "blog") {
  return getRequestConfig(async ({ requestLocale }) => {
    const requested = await requestLocale;
    const locale = hasLocale(locales, requested) ? requested : defaultLocale;

    // Load common + zone-specific dictionaries
    const [common, zoneMsgs] = await Promise.all([
      import(`../dictionaries/${locale}/common.json`).then((m) => m.default),
      import(`../dictionaries/${locale}/${zone}.json`)
        .then((m) => m.default)
        .catch(() => ({})), // graceful fallback
    ]);

    return {
      locale,
      messages: { ...common, ...zoneMsgs },
    };
  });
}
```

### `packages/i18n/package.json`

```jsonc
{
  "name": "@repo/i18n",
  "private": true,
  "exports": {
    "./config": "./src/config.ts",
    "./middleware": "./src/middleware.ts",
    "./navigation": "./src/navigation.ts",
    "./request": "./src/request.ts"
  },
  "dependencies": {
    "next-intl": "^4.x"
  },
  "peerDependencies": {
    "next": "^15.x"
  }
}
```

---

## 4. Shared SEO Package

### `packages/seo/src/constants.ts`

```ts
export const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || "https://example.com";

export const DEFAULT_OG_IMAGE = `${BASE_URL}/og-default.png`;

export const SITE_NAME = "Example";
```

### `packages/seo/src/metadata.ts`

```ts
import type { Metadata } from "next";
import { locales, type Locale, isRtl } from "@repo/i18n/config";
import { BASE_URL, DEFAULT_OG_IMAGE, SITE_NAME } from "./constants";

interface BuildMetadataParams {
  locale: Locale;
  title: string;
  description: string;
  path: string; // e.g. "/docs/getting-started"
  ogImage?: string;
  noIndex?: boolean;
  type?: "website" | "article";
  publishedTime?: string;
  authors?: string[];
}

export function buildMetadata({
  locale,
  title,
  description,
  path,
  ogImage,
  noIndex = false,
  type = "website",
  publishedTime,
  authors,
}: BuildMetadataParams): Metadata {
  const url = `${BASE_URL}/${locale}${path}`;
  const image = ogImage || DEFAULT_OG_IMAGE;
  const dir = isRtl(locale) ? "rtl" : "ltr";

  // Build hreflang alternates for all locales
  const languages: Record<string, string> = {};
  for (const loc of locales) {
    languages[loc] = `${BASE_URL}/${loc}${path}`;
  }
  languages["x-default"] = `${BASE_URL}/en${path}`;

  return {
    title: {
      default: title,
      template: `%s | ${SITE_NAME}`,
    },
    description,
    metadataBase: new URL(BASE_URL),
    alternates: {
      canonical: url,
      languages,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      images: [{ url: image, width: 1200, height: 630 }],
      locale,
      type,
      ...(type === "article" && { publishedTime, authors }),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
    other: {
      dir,
    },
  };
}
```

### `packages/seo/src/json-ld.ts`

```tsx
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
```

### `packages/seo/src/sitemap.ts`

```ts
import type { MetadataRoute } from "next";
import { locales, type Locale } from "@repo/i18n/config";
import { BASE_URL } from "./constants";

interface SitemapEntry {
  path: string; // e.g. "/docs/getting-started"
  lastModified?: Date | string;
  changeFrequency?:
    | "always"
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly"
    | "never";
  priority?: number;
}

/**
 * Generates a sitemap with all locale variants for each path.
 */
export function buildSitemap(entries: SitemapEntry[]): MetadataRoute.Sitemap {
  return entries.flatMap((entry) =>
    locales.map((locale) => ({
      url: `${BASE_URL}/${locale}${entry.path}`,
      lastModified: entry.lastModified,
      changeFrequency: entry.changeFrequency,
      priority: entry.priority,
      alternates: {
        languages: Object.fromEntries(
          locales.map((loc) => [loc, `${BASE_URL}/${loc}${entry.path}`])
        ),
      },
    }))
  );
}
```

---

## 5. Zone Apps

### 5a. Main App (Gateway) — `apps/main`

This is the **entry point**. It serves its own pages AND rewrites zone paths to the other apps.

#### `apps/main/next.config.ts`

```ts
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const DOCS_URL = process.env.DOCS_URL || "http://localhost:3001";
const BLOG_URL = process.env.BLOG_URL || "http://localhost:3002";

const nextConfig: NextConfig = {
  async rewrites() {
    return {
      // "beforeFiles" ensures these fire before the main app's own file-based routes
      beforeFiles: [
        // ── Docs zone ──
        {
          source: "/:locale(en|ar)/docs",
          destination: `${DOCS_URL}/:locale/docs`,
        },
        {
          source: "/:locale(en|ar)/docs/:path*",
          destination: `${DOCS_URL}/:locale/docs/:path*`,
        },

        // ── Blog zone ──
        {
          source: "/:locale(en|ar)/blog",
          destination: `${BLOG_URL}/:locale/blog`,
        },
        {
          source: "/:locale(en|ar)/blog/:path*",
          destination: `${BLOG_URL}/:locale/blog/:path*`,
        },
      ],
    };
  },
};

export default withNextIntl(nextConfig);
```

#### `apps/main/middleware.ts`

```ts
import { createI18nMiddleware } from "@repo/i18n/middleware";
import type { NextRequest } from "next/server";

const i18nMiddleware = createI18nMiddleware();

export default function middleware(request: NextRequest) {
  // Skip middleware for zone paths — they'll be rewritten
  const { pathname } = request.nextUrl;
  const zonePattern = /^\/(en|ar)\/(docs|blog)(\/|$)/;
  if (zonePattern.test(pathname)) {
    return; // Let the rewrite handle it
  }

  return i18nMiddleware(request);
}

export const config = {
  matcher: [
    // Match all paths except static files and API routes
    "/((?!api|_next|_vercel|.*\\..*).*)",
  ],
};
```

#### `apps/main/i18n/request.ts`

```ts
import { createRequestConfig } from "@repo/i18n/request";
export default createRequestConfig("main");
```

#### `apps/main/app/[locale]/layout.tsx`

```tsx
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { locales, isRtl, type Locale } from "@repo/i18n/config";
import { buildMetadata } from "@repo/seo/metadata";
import { websiteJsonLd } from "@repo/seo/json-ld";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return buildMetadata({
    locale: locale as Locale,
    title: "Example",
    description: "Your site description",
    path: "",
  });
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale} dir={isRtl(locale as Locale) ? "rtl" : "ltr"}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteJsonLd()),
          }}
        />
      </head>
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

#### `apps/main/app/[locale]/page.tsx`

```tsx
import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";

export default function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = React.use(params);
  setRequestLocale(locale);
  const t = useTranslations("home");

  return (
    <main>
      <h1>{t("title")}</h1>
    </main>
  );
}
```

#### `apps/main/app/sitemap.ts`

```ts
import { buildSitemap } from "@repo/seo/sitemap";

export default function sitemap() {
  return buildSitemap([
    { path: "", changeFrequency: "daily", priority: 1.0 },
    { path: "/about", changeFrequency: "monthly", priority: 0.8 },
    { path: "/pricing", changeFrequency: "weekly", priority: 0.9 },
  ]);
}
```

---

### 5b. Docs Zone — `apps/docs`

#### `apps/docs/next.config.ts`

```ts
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  // NO basePath — we handle the full /[locale]/docs/... path in file routing
  // assetPrefix needed so static assets load correctly when served through the gateway
  assetPrefix:
    process.env.NODE_ENV === "production"
      ? process.env.NEXT_PUBLIC_BASE_URL
      : undefined,
};

export default withNextIntl(nextConfig);
```

#### `apps/docs/middleware.ts`

```ts
import { createI18nMiddleware } from "@repo/i18n/middleware";

const i18nMiddleware = createI18nMiddleware();

export default i18nMiddleware;

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
```

#### `apps/docs/i18n/request.ts`

```ts
import { createRequestConfig } from "@repo/i18n/request";
export default createRequestConfig("docs");
```

#### Docs App File Structure

```
apps/docs/app/
├── [locale]/
│   └── docs/
│       ├── layout.tsx          # Docs shell (sidebar, ToC)
│       ├── page.tsx            # /en/docs (index)
│       └── [...slug]/
│           └── page.tsx        # /en/docs/getting-started, etc.
├── sitemap.ts
└── robots.ts
```

#### `apps/docs/app/[locale]/docs/layout.tsx`

```tsx
import { setRequestLocale, getMessages } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import { notFound } from "next/navigation";
import { locales, isRtl, type Locale } from "@repo/i18n/config";

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
      <body>
        <NextIntlClientProvider messages={messages}>
          <div className="docs-layout">
            <aside>{/* Sidebar navigation */}</aside>
            <main>{children}</main>
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

#### `apps/docs/app/[locale]/docs/[...slug]/page.tsx`

```tsx
import { setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import { buildMetadata } from "@repo/seo/metadata";
import type { Locale } from "@repo/i18n/config";

// Example: Fetch doc content from MDX/CMS
async function getDoc(slug: string[], locale: string) {
  const path = slug.join("/");
  // Your content fetching logic here
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
```

#### `apps/docs/app/sitemap.ts`

```ts
import { buildSitemap } from "@repo/seo/sitemap";

export default function sitemap() {
  // In practice, fetch from your CMS or file system
  return buildSitemap([
    { path: "/docs", priority: 0.9 },
    { path: "/docs/getting-started", priority: 0.8 },
    { path: "/docs/api-reference", priority: 0.8 },
    { path: "/docs/guides/authentication", priority: 0.7 },
  ]);
}
```

---

### 5c. Blog Zone — `apps/blog`

Identical structure to docs, with `/blog` instead of `/docs`.

#### `apps/blog/next.config.ts`

```ts
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  assetPrefix:
    process.env.NODE_ENV === "production"
      ? process.env.NEXT_PUBLIC_BASE_URL
      : undefined,
};

export default withNextIntl(nextConfig);
```

#### Blog App File Structure

```
apps/blog/app/
├── [locale]/
│   └── blog/
│       ├── layout.tsx
│       ├── page.tsx            # /en/blog (listing)
│       └── [slug]/
│           └── page.tsx        # /en/blog/my-post
├── sitemap.ts
└── robots.ts
```

#### `apps/blog/app/[locale]/blog/[slug]/page.tsx`

```tsx
import { setRequestLocale } from "next-intl/server";
import { buildMetadata } from "@repo/seo/metadata";
import { articleJsonLd } from "@repo/seo/json-ld";
import type { Locale } from "@repo/i18n/config";

async function getPost(slug: string, locale: string) {
  // Fetch from CMS, MDX, etc.
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
```

---

## 6. Development Scripts

### `apps/main/package.json`

```jsonc
{
  "name": "@repo/main",
  "scripts": {
    "dev": "next dev --port 3000",
    "build": "next build",
    "start": "next start --port 3000"
  }
}
```

### `apps/docs/package.json`

```jsonc
{
  "name": "@repo/docs",
  "scripts": {
    "dev": "next dev --port 3001",
    "build": "next build",
    "start": "next start --port 3001"
  }
}
```

### `apps/blog/package.json`

```jsonc
{
  "name": "@repo/blog",
  "scripts": {
    "dev": "next dev --port 3002",
    "build": "next build",
    "start": "next start --port 3002"
  }
}
```

Run all with: `pnpm dev` (Turborepo runs all `dev` scripts in parallel).

---

## 7. Production Deployment

### Option A: Vercel (Recommended)

Each app is a separate Vercel project. The main app uses `vercel.json` rewrites:

#### `apps/main/vercel.json`

```jsonc
{
  "rewrites": [
    {
      "source": "/:locale(en|ar)/docs/:path*",
      "destination": "https://docs.example.internal/:locale/docs/:path*"
    },
    {
      "source": "/:locale(en|ar)/blog/:path*",
      "destination": "https://blog.example.internal/:locale/blog/:path*"
    }
  ]
}
```

> On Vercel, use the **Multi-Zones** feature in project settings to link zone projects. The `destination` URLs will be the Vercel deployment URLs of the zone apps.

### Option B: Self-Hosted (Docker + Nginx)

#### `docker-compose.yml`

```yaml
services:
  main:
    build:
      context: .
      dockerfile: apps/main/Dockerfile
    ports: ["3000:3000"]
    environment:
      - DOCS_URL=http://docs:3001
      - BLOG_URL=http://blog:3002

  docs:
    build:
      context: .
      dockerfile: apps/docs/Dockerfile
    ports: ["3001:3001"]

  blog:
    build:
      context: .
      dockerfile: apps/blog/Dockerfile
    ports: ["3002:3002"]

  nginx:
    image: nginx:alpine
    ports: ["80:80", "443:443"]
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on: [main, docs, blog]
```

#### `nginx.conf`

```nginx
upstream main  { server main:3000; }
upstream docs  { server docs:3001; }
upstream blog  { server blog:3002; }

server {
    listen 80;
    server_name example.com;

    # Zone rewrites
    location ~ ^/(en|ar)/docs(/.*)?$ {
        proxy_pass http://docs;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location ~ ^/(en|ar)/blog(/.*)?$ {
        proxy_pass http://blog;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Everything else → main
    location / {
        proxy_pass http://main;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 8. Cross-Zone Navigation

Since each zone is a separate Next.js app, in-zone navigation uses `<Link>` (client-side), but **cross-zone navigation must be a full page load** (`<a>` tag).

### `packages/ui/src/zone-link.tsx`

```tsx
"use client";

import NextLink from "next/link";
import { usePathname } from "next/navigation";

const ZONE_PREFIXES = ["/docs", "/blog"];

function getZone(path: string): string | null {
  // Strip locale prefix: /en/docs/... → /docs/...
  const withoutLocale = path.replace(/^\/(en|ar)/, "");
  for (const prefix of ZONE_PREFIXES) {
    if (withoutLocale.startsWith(prefix)) return prefix;
  }
  return null;
}

interface ZoneLinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  children: React.ReactNode;
}

/**
 * Smart link component:
 * - Same zone → client-side navigation (Next.js Link)
 * - Cross zone → full page navigation (<a> tag)
 */
export function ZoneLink({ href, children, ...props }: ZoneLinkProps) {
  const pathname = usePathname();
  const currentZone = getZone(pathname);
  const targetZone = getZone(href);

  const isCrossZone = currentZone !== targetZone;

  if (isCrossZone) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  }

  return (
    <NextLink href={href} {...props}>
      {children}
    </NextLink>
  );
}
```

---

## 9. RTL Support

### Shared Tailwind/CSS approach in `packages/ui`

```css
/* packages/ui/src/globals.css */

/* Direction-aware utilities */
[dir="rtl"] .ms-4 { margin-right: 1rem; margin-left: 0; }
[dir="ltr"] .ms-4 { margin-left: 1rem; margin-right: 0; }

/* Or use Tailwind's built-in RTL support */
/* In tailwind.config: plugins: [require('tailwindcss-rtl')] */
```

In your root layout (each zone):

```tsx
<html lang={locale} dir={isRtl(locale) ? "rtl" : "ltr"}>
```

Tailwind v4 has native `rtl:` / `ltr:` variants:

```tsx
<div className="ml-4 rtl:mr-4 rtl:ml-0">
  {/* Automatically adjusts for RTL */}
</div>
```

---

## 10. SEO Checklist

| Concern | Implementation |
|---|---|
| **Canonical URLs** | `buildMetadata()` → `alternates.canonical` |
| **Hreflang tags** | `buildMetadata()` → `alternates.languages` with `x-default` |
| **Open Graph** | `buildMetadata()` → locale-aware OG tags |
| **JSON-LD** | `articleJsonLd()` on blog posts, `websiteJsonLd()` on home |
| **Sitemaps** | Per-zone `sitemap.ts` with `buildSitemap()` — all locale variants |
| **Robots.txt** | Per-zone `robots.ts` pointing to its own sitemap |
| **RTL direction** | `<html dir="rtl">` for Arabic |
| **lang attribute** | `<html lang={locale}>` per page |

### Per-Zone `robots.ts`

```ts
// apps/docs/app/robots.ts
import type { MetadataRoute } from "next";
import { BASE_URL } from "@repo/seo/constants";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${BASE_URL}/docs/sitemap.xml`,
  };
}
```

> **Combined sitemap strategy**: The main app's `sitemap.ts` can link to sub-sitemaps via a sitemap index, or each zone generates its own and the main sitemap index references them all.

---

## Quick Reference: Request Flow

```
Browser: example.com/ar/docs/getting-started
  │
  ▼
[Main App - port 3000]
  │ middleware: detects /ar/docs → skips i18n, lets rewrite handle it
  │ rewrite:   /:locale/docs/:path* → DOCS_URL/:locale/docs/:path*
  │
  ▼
[Docs App - port 3001]
  │ middleware: next-intl detects locale "ar"
  │ route:     app/[locale]/docs/[...slug]/page.tsx
  │ params:    { locale: "ar", slug: ["getting-started"] }
  │
  ▼
  Renders: Arabic docs page with RTL layout
  SEO: canonical, hreflang (en+ar), JSON-LD, OG tags — all correct
```
