import * as z from "zod";

const externalUserSchema = z
	.object({
		token: z.string().optional(),
		accessToken: z.string().optional(),
		id: z.union([z.string(), z.number()]).optional(),
		name: z.string().optional(),
		email: z.string().email().optional(),
		roles: z.array(z.string()).optional(),
	})
	.passthrough();

export type ExternalUserPayload = z.infer<typeof externalUserSchema>;

/**
 * Calls the upstream IdP. Passwords are never persisted — only forwarded over HTTPS to `EXTERNAL_API_URL`.
 */
export async function loginWithExternalApi(
	username: string,
	password: string,
): Promise<{ user: ExternalUserPayload; accessToken: string }> {
	const url =
		process.env.EXTERNAL_API_URL?.trim() || "https://external-api.com/login";

	let res: Response;
	try {
		res = await fetch(url, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ username, password }),
		});
	} catch {
		throw new Error("UPSTREAM_UNREACHABLE");
	}

	let body: unknown;
	try {
		body = await res.json();
	} catch {
		throw new Error("INVALID_RESPONSE");
	}

	if (!res.ok) {
		throw new Error("UPSTREAM_UNAUTHORIZED");
	}

	const parsed = externalUserSchema.safeParse(body);
	if (!parsed.success) {
		throw new Error("INVALID_RESPONSE");
	}

	const accessToken =
		parsed.data.accessToken ?? parsed.data.token ?? "";

	if (!accessToken) {
		throw new Error("NO_ACCESS_TOKEN");
	}

	return { user: parsed.data, accessToken };
}
