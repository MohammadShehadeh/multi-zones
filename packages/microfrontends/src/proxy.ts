import { pathToRegexp } from 'path-to-regexp';
import { getZoneApplications } from './config';

const zoneApplications = getZoneApplications();

const assetPrefixes = zoneApplications.map((app) => app.assetPrefix);

const zonePathPatterns = zoneApplications
	.flatMap((app) => app.routes)
	.map((route) => pathToRegexp(route.source));

/** Requests for any zone's `_next` assets or public files (`/docs-static/...`). */
export function isZoneAssetPath(pathname: string) {
	return assetPrefixes.some(
		(prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
	);
}

/** Requests the default app rewrites to a zone: zone routes and zone assets. */
export function isHandledByZone(pathname: string) {
	return (
		isZoneAssetPath(pathname) || zonePathPatterns.some((pattern) => pattern.test(pathname))
	);
}
