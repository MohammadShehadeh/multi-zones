import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { NextConfig } from 'next';
import { z } from 'zod';
import { getApplication, getZoneApplications, type ZoneApplication } from './config';
import type { LinkRouting } from './link';

type Rewrites = Awaited<ReturnType<NonNullable<NextConfig['rewrites']>>>;
type Rewrite = Extract<Rewrites, unknown[]>[number];

const packageJsonSchema = z.object({ name: z.string() });

function readPackageName() {
	const json: unknown = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8'));
	return packageJsonSchema.parse(json).name;
}

function zoneRewrites(app: ZoneApplication): Rewrite[] {
	const routes = app.routes.map((route) => ({
		source: route.source,
		// Destinations take bare params: `/:locale(en|ar)/docs` -> `/:locale/docs`
		destination: `${app.url}${route.destination.replace(/(:\w+)\([^)]*\)/g, '$1')}`,
	}));

	return [
		{ source: `${app.assetPrefix}/:path*`, destination: `${app.url}${app.assetPrefix}/:path*` },
		...routes,
	];
}

function mergeRewrites(existing: Rewrites | undefined, zones: Rewrite[]) {
	if (!existing) return { beforeFiles: zones };
	if (Array.isArray(existing)) return { beforeFiles: zones, afterFiles: existing };
	return { ...existing, beforeFiles: [...zones, ...(existing.beforeFiles ?? [])] };
}

/**
 * Wires a Next.js app into `zones.json`; the app is identified by its package.json `name`.
 *
 * - default: proxies every zone's routes and assets via `beforeFiles` rewrites
 * - zone: serves its `_next` assets under its `assetPrefix`;
 *   put zone-owned public files in `public/<assetPrefix>/` so they ride the same rewrite
 * - standalone: served on its own host, never proxied
 *
 * Every app gets `MICROFRONTENDS_LINK_ROUTING`, inlined at build time for `<Link>`.
 */
export function withMicrofrontends(nextConfig: NextConfig = {}): NextConfig {
	const app = getApplication(readPackageName());
	const zoneApplications = getZoneApplications();

	const linkRouting: LinkRouting = {
		app: app.name,
		zones: Object.fromEntries(
			zoneApplications.map((zone) => [zone.name, zone.routes.map((route) => route.source)]),
		),
	};
	const env = { ...nextConfig.env, MICROFRONTENDS_LINK_ROUTING: JSON.stringify(linkRouting) };

	switch (app.kind) {
		case 'standalone': {
			const allowedDevOrigins = [...(nextConfig.allowedDevOrigins ?? []), app.host];
			return { ...nextConfig, env, allowedDevOrigins };
		}
		case 'zone':
			return { ...nextConfig, env, assetPrefix: app.assetPrefix };
		case 'default': {
			const rewrites = zoneApplications.flatMap(zoneRewrites);
			return {
				...nextConfig,
				env,
				async rewrites() {
					return mergeRewrites(await nextConfig.rewrites?.(), rewrites);
				},
			};
		}
	}
}
