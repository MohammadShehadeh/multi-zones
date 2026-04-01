import { createI18nMiddleware } from "@repo/i18n/middleware";
import type { NextRequest } from "next/server";

const i18nMiddleware = createI18nMiddleware();

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const zonePattern = /^\/(en|ar)\/(docs|blog)(\/|$)/;

  if (zonePattern.test(pathname)) {
    return;
  }

  return i18nMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)" ],
};
