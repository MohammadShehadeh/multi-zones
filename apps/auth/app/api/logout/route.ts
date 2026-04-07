import { auth } from "@/lib/auth";
import { corsHeadersForRequest } from "@/lib/cors";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Clears Better Auth cookies. Stateless JWTs cannot be centrally revoked without a blocklist —
 * bump `session.cookieCache.version` in auth config to invalidate all sessions if needed.
 */
export async function OPTIONS(request: NextRequest) {
	return new NextResponse(null, {
		status: 204,
		headers: corsHeadersForRequest(request),
	});
}

export async function POST(request: NextRequest) {
	const cors = corsHeadersForRequest(request);

	await auth.api.signOut({
		headers: request.headers,
	});

	return NextResponse.json({ ok: true }, { status: 200, headers: cors });
}
