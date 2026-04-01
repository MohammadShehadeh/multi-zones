import { createI18nMiddleware } from '@repo/i18n/middleware';

export const proxy = createI18nMiddleware();

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
