import NextLink from 'next/link';
import { pathToRegexp } from 'path-to-regexp';
import type { ComponentProps } from 'react';

/** Built by `withMicrofrontends` and inlined at build time, so no config ships to the browser. */
export interface LinkRouting {
	app: string;
	/** Zone name -> the route sources it owns. */
	zones: Record<string, string[]>;
}

if (!process.env.MICROFRONTENDS_LINK_ROUTING) {
	throw new Error('[microfrontends] <Link> needs next.config wrapped with withMicrofrontends()');
}

const routing: LinkRouting = JSON.parse(process.env.MICROFRONTENDS_LINK_ROUTING);
const zonePatterns = Object.entries(routing.zones).map(([name, sources]) => ({
	name,
	patterns: sources.map((source) => pathToRegexp(source)),
}));

// `null` is the default app: it owns every path no zone claims
const currentZone = routing.app in routing.zones ? routing.app : null;

function isSameApp(href: string) {
	// Absolute (`https:`, `mailto:`, `//host`) leaves the app
	if (/^([a-z][a-z\d+.-]*:|\/\/)/i.test(href)) return false;
	// Relative (`#top`, `?page=2`) stays on the current page
	if (!href.startsWith('/')) return true;

	const pathname = href.split(/[?#]/)[0] ?? href;
	const targetZone =
		zonePatterns.find((zone) => zone.patterns.some((pattern) => pattern.test(pathname)))
			?.name ?? null;
	return targetZone === currentZone;
}

interface LinkProps extends ComponentProps<'a'> {
	href: string;
	prefetch?: ComponentProps<typeof NextLink>['prefetch'];
}

/**
 * `next/link` for routes this app serves; a plain `<a>` (full page load) for routes
 * another app serves, since client navigation can't cross apps.
 * No hooks, so it works in both server and client components.
 */
export const Link = ({ href, prefetch, ...props }: LinkProps) => {
	if (isSameApp(href)) return <NextLink href={href} prefetch={prefetch} {...props} />;
	return <a href={href} {...props} />;
};
