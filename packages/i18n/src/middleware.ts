import createMiddleware from "next-intl/middleware";
import { locales, defaultLocale } from "./config";

export function createI18nMiddleware() {
  return createMiddleware({
    locales,
    defaultLocale,
    localePrefix: "always",
    localeDetection: true,
  });
}
