import { createI18nMiddleware } from "@repo/i18n/middleware";

export const proxy = createI18nMiddleware();

export const config = {
	matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
