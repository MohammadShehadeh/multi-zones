import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import { withMicrofrontends } from '@repo/microfrontends/next/config';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {};

export default withNextIntl(withMicrofrontends(nextConfig));
