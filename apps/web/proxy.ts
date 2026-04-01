import { createI18nMiddleware } from "@repo/i18n/middleware";
import type { NextRequest } from "next/server";

const i18nMiddleware = createI18nMiddleware();

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip locale handling for zone API routes (no locale in URL)
  const zoneApiPattern = /^\/(docs|blog)\/api(\/|$)/;
  // Skip locale handling for locale-prefixed zone routes (rewrite handles them)
  const zonePrefixedPattern = /^\/(en|ar)\/(docs|blog)(\/|$)/;

  if (zoneApiPattern.test(pathname) || zonePrefixedPattern.test(pathname)) {
    return;
  }

  return i18nMiddleware(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon and common image extensions
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|bmp|tiff|avif)$).*)',
  ],
};
