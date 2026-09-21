import { z } from 'zod';

const routingGroupSchema = z.strictObject({
	group: z.string().optional().describe('Label for readers, e.g. "pages" or "api".'),
	paths: z
		.array(
			z.union([
				z.string(),
				z.strictObject({ source: z.string(), destination: z.string() }),
			]),
		)
		.min(1)
		.describe(
			'Next.js rewrite source syntax. A string is forwarded as-is; { source, destination } rewrites the path.',
		),
});

const applicationConfigSchema = z.strictObject({
	default: z
		.boolean()
		.optional()
		.describe('The app that owns the public domain and proxies every zone. Exactly one.'),
	assetPrefix: z
		.string()
		.optional()
		.describe('Path segment for this zone\'s _next assets and public files, e.g. "docs-static". Required with "routing".'),
	routing: z
		.array(routingGroupSchema)
		.min(1)
		.optional()
		.describe('Paths the default app forwards to this zone. Omit for a standalone app served on its own host.'),
	development: z.strictObject({
		local: z.int().describe('Local dev/start port.'),
		host: z.string().optional().describe('Local hostname, e.g. "dashboard.localhost". Defaults to "localhost".'),
	}),
	production: z.strictObject({ url: z.url() }),
});

export const zonesConfigSchema = z
	.strictObject({
		$schema: z.string().optional(),
		applications: z
			.record(z.string(), applicationConfigSchema)
			.describe("Keyed by each app's package.json name."),
	})
	.refine(
		(config) =>
			Object.values(config.applications).filter((app) => app.default).length ===
			1,
		'Exactly one application must be marked "default": true',
	)
	.refine(
		(config) =>
			Object.values(config.applications).every(
				(app) => !app.default || !app.routing,
			),
		'The default application cannot have "routing"',
	)
	.refine(
		(config) =>
			Object.values(config.applications).every(
				(app) => !app.assetPrefix === !app.routing,
			),
		'"assetPrefix" and "routing" must be set together',
	);

export type ApplicationConfig = z.infer<typeof applicationConfigSchema>;
