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
