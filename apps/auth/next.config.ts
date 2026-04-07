import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const DOCS_URL = process.env.DOCS_URL || 'http://localhost:3001';
const BLOG_URL = process.env.BLOG_URL || 'http://localhost:3002';

const nextConfig: NextConfig = {
	async rewrites() {
		return {
			beforeFiles: [
				// API routes — no locale prefix
				{
					source: "/docs/api/:path*",
					destination: `${DOCS_URL}/api/:path*`,
				},
				{
					source: "/blog/api/:path*",
					destination: `${BLOG_URL}/api/:path*`,
				},

				// Locale-prefixed zone routes
				{
					source: "/:locale(en|ar)/docs",
					destination: `${DOCS_URL}/:locale/docs`,
				},
				{
					source: "/:locale(en|ar)/docs/:path*",
					destination: `${DOCS_URL}/:locale/docs/:path*`,
				},
				{
					source: "/:locale(en|ar)/blog",
					destination: `${BLOG_URL}/:locale/blog`,
				},
				{
					source: "/:locale(en|ar)/blog/:path*",
					destination: `${BLOG_URL}/:locale/blog/:path*`,
				},
			],
		};
	},
};

export default withNextIntl(nextConfig);
