import { z } from 'zod';
import raw from '../../../zones.json' with { type: 'json' };
import { zonesConfigSchema, type ApplicationConfig } from './schema';

interface ApplicationBase {
	name: string;
	url: string;
}

/** Owns the public domain and proxies every zone. */
interface DefaultApplication extends ApplicationBase {
	kind: 'default';
}

/** A path the default app forwards to a zone; `source` uses Next.js rewrite syntax. */
interface ZoneRoute {
	source: string;
	destination: string;
}

/** Serves routes on the default app's domain, proxied through it. */
export interface ZoneApplication extends ApplicationBase {
	kind: 'zone';
	routes: ZoneRoute[];
	assetPrefix: string;
}

/** Served on its own host (e.g. `dashboard.localhost:3003`), never proxied. */
interface StandaloneApplication extends ApplicationBase {
	kind: 'standalone';
	host: string;
}

type Application = DefaultApplication | ZoneApplication | StandaloneApplication;

const parsed = zonesConfigSchema.safeParse(raw);
if (!parsed.success) {
	throw new Error(
		`[microfrontends] Invalid zones.json\n${z.prettifyError(parsed.error)}`,
	);
}
const config = parsed.data;

// Local URLs in development, production URLs otherwise.
// `MFE_ENV=development` forces local URLs (e.g. `next build && next start` on your machine).
const isDevelopment = process.env.MFE_ENV
	? process.env.MFE_ENV === 'development'
	: process.env.NODE_ENV !== 'production';

function resolveApplication(name: string, app: ApplicationConfig): Application {
	const port = app.development.local;
	const host = app.development.host ?? 'localhost';
	// `MFE_DOCS_URL` overrides the `docs` URL (staging, preview, CI)
	const overrideUrl =
		process.env[`MFE_${name.toUpperCase().replace(/[^A-Z0-9]/g, '_')}_URL`];
	const url = (
		overrideUrl ??
		(isDevelopment ? `http://${host}:${port}` : app.production.url)
	).replace(/\/$/, '');

	if (app.default) return { name, url, kind: 'default' };
	if (app.routing && app.assetPrefix) {
		// A string path is forwarded unchanged
		const routes = app.routing
			.flatMap((group) => group.paths)
			.map((path) => (typeof path === 'string' ? { source: path, destination: path } : path));
		return { name, url, kind: 'zone', routes, assetPrefix: `/${app.assetPrefix}` };
	}
	return { name, url, kind: 'standalone', host };
}

function getApplications() {
	return Object.entries(config.applications).map(([name, app]) =>
		resolveApplication(name, app),
	);
}

export function getApplication(name: string) {
	const app = config.applications[name];
	if (!app) {
		throw new Error(
			`[microfrontends] Unknown application "${name}". Known: ${Object.keys(config.applications).join(', ')}`,
		);
	}
	return resolveApplication(name, app);
}

export function getDefaultApplication() {
	const app = getApplications().find((a) => a.kind === 'default');
	// Unreachable: zones.json validation requires exactly one default application
	if (!app) throw new Error('[microfrontends] No default application');
	return app;
}

export function getZoneApplications() {
	return getApplications().filter((app) => app.kind === 'zone');
}
