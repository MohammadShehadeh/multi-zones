import { auth } from '@/lib/auth';
import { corsHeadersForRequest } from '@/lib/cors';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

type MePayload = {
	user: unknown;
	accessToken: string | null;
	authenticated: boolean;
	session?: unknown;
	provider?: string;
};

/**
 * Returns the current session derived from the signed JWT cookie (no DB round-trip when cache hits).
 */
export async function OPTIONS(request: NextRequest) {
	return new NextResponse(null, {
		status: 204,
		headers: corsHeadersForRequest(request),
	});
}

export async function GET(request: NextRequest) {
	const cors = corsHeadersForRequest(request);

	const data = (await auth.api.getSession({
		headers: request.headers,
	})) as MePayload | null;

	if (!data?.authenticated && !data?.user) {
		return NextResponse.json(
			{ authenticated: false, user: null, accessToken: null },
			{ status: 200, headers: cors },
		);
	}

	return NextResponse.json(
		{
			user: data.user ?? null,
			accessToken: data.accessToken ?? null,
			authenticated: true,
			provider: data.provider ?? 'external-api',
		},
		{ status: 200, headers: cors },
	);
}
