import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { NextConfig } from 'next';
import type { Rewrite } from 'next/dist/lib/load-custom-routes';
import {
	getApplication,
	getAssetPrefix,
	getChildApplications,
	type Application,
} from './config';

type Rewrites = Awaited<ReturnType<NonNullable<NextConfig['rewrites']>>>;

function readPackageName() {
	const pkg = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8'));
	return pkg.name as string;
}

/** Destinations take bare params: `/:locale(en|ar)/docs` -> `/:locale/docs`. */
function toDestination(path: string) {
	return path.replace(/(:\w+)\([^)]*\)/g, '$1');
}

function zoneRewrites(app: Application): Rewrite[] {
	const assetPrefix = getAssetPrefix(app);
	const routes = (app.routing ?? []).flatMap((group) =>
		group.paths.map((rule) => {
			const { source, destination } =
				typeof rule === 'string' ? { source: rule, destination: rule } : rule;
			return { source, destination: `${app.url}${toDestination(destination)}` };
		}),
	);

	return [
		{ source: `${assetPrefix}/:path*`, destination: `${app.url}${assetPrefix}/:path*` },
		...routes,
	];
}

function mergeRewrites(existing: Rewrites | undefined, zones: Rewrite[]) {
	if (!existing) return { beforeFiles: zones };
	if (Array.isArray(existing)) return { beforeFiles: zones, afterFiles: existing };
	return { ...existing, beforeFiles: [...zones, ...(existing.beforeFiles ?? [])] };
}

/**
 * Wires a Next.js app into the zones described in `zones.json`.
 * The app is identified by its package.json `name` (override with `appName`).
 *
 * - default app: proxies every child zone's routes and assets via `beforeFiles` rewrites
 * - child app: serves its `_next` assets under its own `assetPrefix`;
 *   put zone-owned public files in `public/<assetPrefix>/` so they ride the same rewrite
 */
export function withMicrofrontends(
	nextConfig: NextConfig = {},
	options: { appName?: string } = {},
): NextConfig {
	const app = getApplication(options.appName ?? readPackageName());

	if (!app.default) {
		return { ...nextConfig, assetPrefix: getAssetPrefix(app) };
	}

	const zones = getChildApplications().flatMap(zoneRewrites);

	return {
		...nextConfig,
		async rewrites() {
			return mergeRewrites(await nextConfig.rewrites?.(), zones);
		},
	};
}
