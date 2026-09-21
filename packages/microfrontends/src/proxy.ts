import { pathToRegexp } from 'path-to-regexp';
import { getAssetPrefix, getApplications } from './config';

const applications = getApplications();

const assetPrefixes = applications.map((app) => getAssetPrefix(app));

const childZonePatterns = applications
	.filter((app) => !app.default)
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
