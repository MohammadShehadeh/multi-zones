"use client";

import NextLink from "next/link";
import { usePathname } from "next/navigation";

const ZONE_PREFIXES = ["/docs", "/blog"];

function getZone(path: string): string | null {
  const withoutLocale = path.replace(/^\/(en|ar)/, "");
  for (const prefix of ZONE_PREFIXES) {
    if (withoutLocale.startsWith(prefix)) return prefix;
  }
  return null;
}

interface ZoneLinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  children: React.ReactNode;
}

export function ZoneLink({ href, children, ...props }: ZoneLinkProps) {
  const pathname = usePathname();
  const currentZone = getZone(pathname);
  const targetZone = getZone(href);

  const isCrossZone = currentZone !== targetZone;

  if (isCrossZone) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  }

  return (
    <NextLink href={href} {...props}>
      {children}
    </NextLink>
  );
}
