import { pathToRegexp } from 'path-to-regexp';
import { getAssetPrefix, getChildApplications } from './config';

const childApplications = getChildApplications();

const assetPrefixes = childApplications.map((app) => getAssetPrefix(app));

const childZonePatterns = childApplications
	.flatMap((app) => app.routing ?? [])
	.flatMap((group) => group.paths)
	.map((rule) => pathToRegexp(typeof rule === 'string' ? rule : rule.source));

/** Requests for any zone's `_next` assets (`/docs-static/...`). */
export function isZoneAssetPath(pathname: string) {
	return assetPrefixes.some(
		(prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
	);
}

/** Requests the default app forwards to a child zone. */
export function isChildZonePath(pathname: string) {
	return childZonePatterns.some((pattern) => pattern.test(pathname));
}

/**
 * True when this app's own proxy logic (i18n, auth, ...) must not run:
 * zone assets, and — in the default app — routes owned by a child zone.
 */
export function isMicrofrontendsPassthrough(pathname: string) {
	return isZoneAssetPath(pathname) || isChildZonePath(pathname);
}
