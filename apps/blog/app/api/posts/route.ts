import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    zone: "blog",
    note: "This route has no locale prefix — /blog/api/posts",
    posts: [
      { slug: "getting-started", title: "Getting Started with Multi-Zones" },
      { slug: "i18n-deep-dive", title: "Deep Dive into i18n with next-intl" },
    ],
  });
}
