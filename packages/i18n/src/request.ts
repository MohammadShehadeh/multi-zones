import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { locales, defaultLocale } from "./config";

export function createRequestConfig(zone: "main" | "docs" | "blog") {
  return getRequestConfig(async ({ requestLocale }) => {
    const requested = await requestLocale;
    const locale = hasLocale(locales, requested) ? requested : defaultLocale;

    const [common, zoneMsgs] = await Promise.all([
      import(`../dictionaries/${locale}/common.json`).then((m) => m.default),
      import(`../dictionaries/${locale}/${zone}.json`)
        .then((m) => m.default)
        .catch(() => ({})),
    ]);

    return {
      locale,
      messages: { ...common, ...zoneMsgs },
    };
  });
}
