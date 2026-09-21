import NextLink from 'next/link';
import { pathToRegexp } from 'path-to-regexp';
import type { ComponentProps } from 'react';

/** Built per app by `withMicrofrontends` and inlined at build time. */
export interface LinkRouting {
	isZone: boolean;
	/** A zone: the paths it serves. Otherwise: the paths zones take from this app (none for standalone). */
	paths: string[];
}

if (!process.env.NEXT_PUBLIC_MFE_LINK_ROUTING) {
	throw new Error('[microfrontends] <Link> needs next.config wrapped with withMicrofrontends()');
}
const routing: LinkRouting = JSON.parse(process.env.NEXT_PUBLIC_MFE_LINK_ROUTING);
const patterns = routing.paths.map((path) => pathToRegexp(path));

function isServedByThisApp(href: string) {
	const pathname = href.split(/[?#]/)[0] ?? href;
	const matches = patterns.some((pattern) => pattern.test(pathname));
	return routing.isZone ? matches : !matches;
}

interface LinkProps extends ComponentProps<'a'> {
	href: string;
	prefetch?: ComponentProps<typeof NextLink>['prefetch'];
}

/** Client navigation can't cross apps, so links to another app's paths are plain `<a>`. */
export const Link = ({ href, prefetch, ...props }: LinkProps) => {
	if (href.startsWith('/') && !isServedByThisApp(href)) return <a href={href} {...props} />;
	return <NextLink href={href} prefetch={prefetch} {...props} />;
};
