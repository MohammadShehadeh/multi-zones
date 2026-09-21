import raw from '../../../zones.json' with { type: 'json' };

export type PathRule = string | { source: string; destination: string };

export type RoutingGroup = {
	group?: string;
	paths: PathRule[];
};

export type ApplicationConfig = {
	default?: boolean;
	assetPrefix?: string;
	routing?: RoutingGroup[];
	development: { local: number; host?: string };
	production: { url: string };
};

export type MicrofrontendsConfig = {
	applications: Record<string, ApplicationConfig>;
};

export type Application = ApplicationConfig & {
	name: string;
	host: string;
	port: number;
	url: string;
};

const config = raw as MicrofrontendsConfig;

/**
 * Local ports in development, production URLs otherwise.
 * `MICROFRONTENDS_ENV=development` forces local URLs (e.g. `next build && next start` on your machine).
 */
function isDevelopment() {
	const override = process.env.MICROFRONTENDS_ENV;
	if (override) return override === 'development';
	return process.env.NODE_ENV !== 'production';
}

/** `MFE_DOCS_URL` overrides the URL of the `docs` app (staging, preview, CI). */
function urlOverride(name: string) {
	return process.env[`MFE_${name.toUpperCase().replace(/[^A-Z0-9]/g, '_')}_URL`];
}

function resolve(name: string, app: ApplicationConfig): Application {
	const port = app.development.local;
	const host = app.development.host ?? 'localhost';
	const url =
		urlOverride(name) ??
		(isDevelopment() ? `http://${host}:${port}` : app.production.url);

	return { ...app, name, host, port, url: url.replace(/\/$/, '') };
}

export function getApplications(): Application[] {
	return Object.entries(config.applications).map(([name, app]) =>
		resolve(name, app),
	);
}

export function getApplication(name: string): Application {
	const app = config.applications[name];
	if (!app) {
		throw new Error(
			`[microfrontends] Unknown application "${name}". Known: ${Object.keys(config.applications).join(', ')}`,
		);
	}
	return resolve(name, app);
}

export function getDefaultApplication(): Application {
	const app = getApplications().find((a) => a.default);
	if (!app) throw new Error('[microfrontends] No application marked "default": true');
	return app;
}

/**
 * Child zones: applications that own routes on the default app's domain.
 * Apps without `routing` are standalone (own domain, e.g. `dashboard.localhost:3003`)
 * and are never proxied by the default app.
 */
export function getChildApplications(): Application[] {
	return getApplications().filter((a) => !a.default && a.routing);
}

export function getAssetPrefix(app: ApplicationConfig & { name: string }) {
	return `/${app.assetPrefix ?? `${app.name}-static`}`;
}
