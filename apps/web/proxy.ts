import { createI18nMiddleware } from '@repo/i18n/middleware';
import { isHandledByZone } from '@repo/microfrontends/next/proxy';
import type { NextRequest } from 'next/server';

const i18nMiddleware = createI18nMiddleware();

export function proxy(request: NextRequest) {
  // Rewritten to the zone that owns it (see zones.json); the zone runs its own proxy
  if (isHandledByZone(request.nextUrl.pathname)) {
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
