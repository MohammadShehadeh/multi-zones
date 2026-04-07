import { betterAuth } from "better-auth";
import { customSession } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { externalSignInPlugin } from "./plugins/external-sign-in";
import type { ExternalSignInBody } from "./plugins/external-sign-in";

/** Prefer `AUTH_SECRET` (per spec); `BETTER_AUTH_SECRET` is also read by Better Auth. */
const authSecret =
	process.env.AUTH_SECRET ?? process.env.BETTER_AUTH_SECRET;
const baseURL =
	process.env.BETTER_AUTH_URL ??
	process.env.AUTH_BASE_URL ??
	"http://localhost:3003/api/auth";

const sameSiteEnv = process.env.AUTH_COOKIE_SAMESITE?.toLowerCase();
const sameSite: "lax" | "none" | "strict" =
	sameSiteEnv === "none"
		? "none"
		: sameSiteEnv === "strict"
			? "strict"
			: "lax";

const cookieDomain = process.env.AUTH_COOKIE_DOMAIN?.trim();

/**
 * Central auth service: no database — Better Auth uses an in-memory adapter internally,
 * while the **session** is a signed JWT in cookies (`session.cookieCache.strategy: "jwt"`).
 * External IdP data and API tokens live on the user record embedded in that JWT payload.
 */
export const auth = betterAuth({
	secret: authSecret,
	baseURL,
	trustedOrigins: process.env.AUTH_TRUSTED_ORIGINS?.split(",")
		.map((o) => o.trim())
		.filter(Boolean),

	session: {
		expiresIn: 60 * 60 * 24 * 7,
		cookieCache: {
			enabled: true,
			strategy: "jwt",
			maxAge: 60 * 60 * 24 * 7,
			refreshCache: true,
		},
	},

	account: {
		storeStateStrategy: "cookie",
		storeAccountCookie: true,
	},

	user: {
		additionalFields: {
			externalAccessToken: {
				type: "string",
				required: false,
				input: false,
			},
			rolesJson: {
				type: "string",
				required: false,
				input: false,
			},
			externalUserJson: {
				type: "string",
				required: false,
				input: false,
			},
			authProvider: {
				type: "string",
				required: false,
				defaultValue: "external-api",
				input: false,
			},
		},
	},

	advanced: {
		defaultCookieAttributes: {
			secure: process.env.NODE_ENV === "production",
			sameSite,
			partitioned: false,
			...(cookieDomain ? { domain: cookieDomain } : {}),
			path: "/",
			httpOnly: true,
		},
	},

	plugins: [
		customSession(async (payload) => {
			const u = payload.user as Record<string, unknown>;
			const rolesJson = u.rolesJson;
			let roles: string[] = [];
			try {
				if (typeof rolesJson === "string" && rolesJson.length)
					roles = JSON.parse(rolesJson) as string[];
			} catch {
				roles = [];
			}

			let profile: Record<string, unknown> = {};
			try {
				if (typeof u.externalUserJson === "string" && u.externalUserJson.length)
					profile = JSON.parse(u.externalUserJson) as Record<string, unknown>;
			} catch {
				profile = {};
			}

			const accessToken =
				typeof u.externalAccessToken === "string" ? u.externalAccessToken : null;
			const provider =
				typeof u.authProvider === "string" ? u.authProvider : "external-api";

			const publicUser = {
				id: u.id,
				name: u.name,
				email: u.email,
				emailVerified: u.emailVerified,
				image: u.image,
				createdAt: u.createdAt,
				updatedAt: u.updatedAt,
				...profile,
				roles: Array.isArray(profile.roles) ? profile.roles : roles,
			};

			return {
				session: payload.session,
				user: publicUser,
				accessToken,
				provider,
				authenticated: true,
			};
		}),
		externalSignInPlugin(),
		nextCookies(),
	],
});

/**
 * Typed wrapper: Better Auth's generated `auth.api` type does not always include plugin endpoints.
 * This calls the plugin-registered `signIn` server action (POST `/sign-in/external-session`).
 */
export function signInExternalSession(input: {
	body: ExternalSignInBody;
	headers: Headers;
}) {
	return (
		auth.api as unknown as {
			signIn: (args: typeof input) => Promise<unknown>;
		}
	).signIn(input);
}

/** Alias matching the plugin-registered `auth.api.signIn` (Better Auth typings omit plugin routes). */
export const signIn = signInExternalSession;
