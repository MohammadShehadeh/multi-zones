import { signIn } from "@/lib/auth";
import { corsHeadersForRequest } from "@/lib/cors";
import { loginWithExternalApi } from "@/lib/external-api";
import { isAPIError } from "better-auth/api";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import * as z from "zod";

const loginBody = z.object({
	username: z.string().min(1),
	password: z.string().min(1),
});

/**
 * Validates credentials with the upstream API, then issues a Better Auth session (JWT in cookies).
 * Passwords are never stored — only forwarded to `EXTERNAL_API_URL` for verification.
 */
export async function OPTIONS(request: NextRequest) {
	return new NextResponse(null, {
		status: 204,
		headers: corsHeadersForRequest(request),
	});
}

export async function POST(request: NextRequest) {
	const cors = corsHeadersForRequest(request);

	let json: unknown;
	try {
		json = await request.json();
	} catch {
		return NextResponse.json(
			{ error: "Expected JSON body" },
			{ status: 400, headers: cors },
		);
	}

	const parsed = loginBody.safeParse(json);
	if (!parsed.success) {
		return NextResponse.json(
			{ error: "Invalid input", details: parsed.error.flatten() },
			{ status: 400, headers: cors },
		);
	}

	const { username, password } = parsed.data;

	try {
		const { user, accessToken } = await loginWithExternalApi(username, password);
		const id = user.id ?? username;

		await signIn({
			body: {
				user: { ...user, id },
				accessToken,
				provider: "external-api",
			},
			headers: request.headers,
		});

		return NextResponse.json({ ok: true }, { status: 200, headers: cors });
	} catch (e) {
		const code = e instanceof Error ? e.message : "UNKNOWN";

		if (code === "UPSTREAM_UNAUTHORIZED") {
			return NextResponse.json(
				{ error: "Invalid credentials" },
				{ status: 401, headers: cors },
			);
		}
		if (code === "UPSTREAM_UNREACHABLE") {
			return NextResponse.json(
				{ error: "Authentication service unreachable" },
				{ status: 502, headers: cors },
			);
		}
		if (code === "NO_ACCESS_TOKEN" || code === "INVALID_RESPONSE") {
			return NextResponse.json(
				{ error: "Invalid response from authentication provider" },
				{ status: 502, headers: cors },
			);
		}

		if (isAPIError(e)) {
			return NextResponse.json(
				{ error: e.message },
				{ status: typeof e.status === "number" ? e.status : 500, headers: cors },
			);
		}

		return NextResponse.json(
			{ error: "Login failed" },
			{ status: 500, headers: cors },
		);
	}
}
