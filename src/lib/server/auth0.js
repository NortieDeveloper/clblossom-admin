import { env } from '$env/dynamic/private';
import { redirect } from '@sveltejs/kit';
import { createHash, randomBytes } from 'node:crypto';

const SESSION_COOKIE = 'clblossom_admin_auth0';
const STATE_COOKIE = 'clblossom_auth0_state';
const VERIFIER_COOKIE = 'clblossom_auth0_verifier';

function auth0Domain() {
	const domain = env.AUTH0_DOMAIN?.trim().replace(/^https?:\/\//, '').replace(/\/+$/, '');
	if (!domain) throw new Error('AUTH0_DOMAIN is not configured.');
	return domain;
}

function required(name) {
	const value = env[name]?.trim();
	if (!value) throw new Error(`${name} is not configured.`);
	return value;
}

function base64Url(input) {
	return Buffer.from(input)
		.toString('base64')
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=+$/g, '');
}

function codeChallenge(verifier) {
	return base64Url(createHash('sha256').update(verifier).digest());
}

function decodeJwtPayload(token) {
	const payload = token?.split('.')[1];
	if (!payload) return {};

	try {
		return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
	} catch {
		return {};
	}
}

function redirectUri(event) {
	return `${event.url.origin}/auth/callback`;
}

function cookieOptions(maxAge) {
	return {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: env.AUTH0_COOKIE_SECURE === 'true',
		maxAge
	};
}

export function getAuthSession(event) {
	const raw = event.cookies.get(SESSION_COOKIE);
	if (!raw) return null;

	try {
		const session = JSON.parse(raw);
		if (!session.accessToken || !session.expiresAt || Date.now() >= Number(session.expiresAt)) {
			clearAuthSession(event);
			return null;
		}

		return session;
	} catch {
		clearAuthSession(event);
		return null;
	}
}

export function clearAuthSession(event) {
	event.cookies.delete(SESSION_COOKIE, { path: '/' });
}

export function startLogin(event) {
	const state = base64Url(randomBytes(32));
	const verifier = base64Url(randomBytes(64));
	event.cookies.set(STATE_COOKIE, state, cookieOptions(10 * 60));
	event.cookies.set(VERIFIER_COOKIE, verifier, cookieOptions(10 * 60));

	const params = new URLSearchParams({
		response_type: 'code',
		client_id: required('AUTH0_CLIENT_ID'),
		redirect_uri: redirectUri(event),
		scope: 'openid profile email',
		audience: required('AUTH0_AUDIENCE'),
		state,
		code_challenge: codeChallenge(verifier),
		code_challenge_method: 'S256'
	});

	throw redirect(303, `https://${auth0Domain()}/authorize?${params}`);
}

export async function completeLogin(event) {
	const auth0Error = event.url.searchParams.get('error');
	if (auth0Error) {
		const description = event.url.searchParams.get('error_description') || auth0Error;
		throw redirect(303, `/login?error=${encodeURIComponent(description)}`);
	}

	const returnedState = event.url.searchParams.get('state');
	const code = event.url.searchParams.get('code');
	const expectedState = event.cookies.get(STATE_COOKIE);
	const verifier = event.cookies.get(VERIFIER_COOKIE);

	event.cookies.delete(STATE_COOKIE, { path: '/' });
	event.cookies.delete(VERIFIER_COOKIE, { path: '/' });

	if (!code) {
		throw redirect(303, '/login?error=missing_code');
	}
	if (!returnedState) {
		throw redirect(303, '/login?error=missing_state');
	}
	if (!expectedState || !verifier) {
		throw redirect(303, '/login?error=missing_login_cookie');
	}
	if (returnedState !== expectedState) {
		throw redirect(303, '/login?error=state_mismatch');
	}

	const response = await fetch(`https://${auth0Domain()}/oauth/token`, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({
			grant_type: 'authorization_code',
			client_id: required('AUTH0_CLIENT_ID'),
			client_secret: required('AUTH0_CLIENT_SECRET'),
			code,
			code_verifier: verifier,
			redirect_uri: redirectUri(event)
		})
	});

	if (!response.ok) {
		throw redirect(303, '/login?error=token_exchange_failed');
	}

	const token = await response.json();
	const idClaims = decodeJwtPayload(token.id_token);
	const maxAge = Math.max(60, Number(token.expires_in ?? 3600));
	event.cookies.set(
		SESSION_COOKIE,
		JSON.stringify({
			accessToken: token.access_token,
			expiresAt: Date.now() + maxAge * 1000,
			name: idClaims.name || idClaims.nickname || idClaims.email || null,
			email: idClaims.email || null
		}),
		cookieOptions(maxAge)
	);

	throw redirect(303, '/');
}

export function logout(event) {
	clearAuthSession(event);
	const returnTo = `${event.url.origin}/login`;
	const params = new URLSearchParams({
		client_id: required('AUTH0_CLIENT_ID'),
		logout_hint: '',
		post_logout_redirect_uri: returnTo
	});
	params.delete('logout_hint');

	throw redirect(303, `https://${auth0Domain()}/oidc/logout?${params}`);
}
