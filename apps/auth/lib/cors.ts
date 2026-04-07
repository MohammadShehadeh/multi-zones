import type { NextRequest } from "next/server";

const TRUSTED = process.env.AUTH_TRUSTED_ORIGINS?.split(",")
	.map((o) => o.trim())
	.filter(Boolean);

/**
 * Reflects a trusted browser origin for credentialed cross-site calls (e.g. app on `app.example.com` calling `auth.example.com`).
 */
export function corsHeadersForRequest(request: NextRequest): HeadersInit {
	const origin = request.headers.get("origin");
	const headers = new Headers();

	if (origin && TRUSTED?.includes(origin)) {
		headers.set("Access-Control-Allow-Origin", origin);
		headers.set("Access-Control-Allow-Credentials", "true");
		headers.set("Vary", "Origin");
	}

	headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
	headers.set(
		"Access-Control-Allow-Headers",
		"Content-Type, Authorization, Cookie",
	);

	return headers;
}
