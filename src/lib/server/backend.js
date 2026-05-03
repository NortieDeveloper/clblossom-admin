import { env } from '$env/dynamic/private';
import { fail, redirect } from '@sveltejs/kit';

const DEFAULT_ADMIN_BACKEND_API_URL = 'http://localhost:5007';

function baseUrl() {
	return (env.ADMIN_BACKEND_API_URL || DEFAULT_ADMIN_BACKEND_API_URL).replace(/\/+$/, '');
}

function getSetCookieHeaders(headers) {
	if (typeof headers.getSetCookie === 'function') return headers.getSetCookie();
	const raw = headers.get('set-cookie');
	if (!raw) return [];
	return raw.split(/,(?=\s*[^;,=\s]+=[^;,]+)/g).map((value) => value.trim());
}

export function copyBackendCookies(event, response) {
	for (const header of getSetCookieHeaders(response.headers)) {
		const [nameValue, ...attributeParts] = header.split(';').map((part) => part.trim());
		const separator = nameValue.indexOf('=');
		if (separator < 0) continue;

		const name = nameValue.slice(0, separator);
		const value = nameValue.slice(separator + 1);
		const attributes = Object.fromEntries(
			attributeParts.map((part) => {
				const [key, ...rest] = part.split('=');
				return [key.toLowerCase(), rest.join('=') || true];
			})
		);
		const path = attributes.path?.toString() || '/';
		const options = {
			path,
			httpOnly: 'httponly' in attributes,
			secure: 'secure' in attributes,
			sameSite: attributes.samesite?.toString().toLowerCase() || 'lax'
		};
		if (attributes['max-age'] !== undefined) options.maxAge = Number(attributes['max-age']);
		if (attributes.expires) options.expires = new Date(attributes.expires.toString());

		if (options.maxAge === 0 || value === '') event.cookies.delete(name, { path });
		else event.cookies.set(name, value, options);
	}
}

export async function backendFetch(event, path, init = {}) {
	const headers = new Headers(init.headers);
	const cookie = event.request.headers.get('cookie');
	if (cookie) headers.set('cookie', cookie);
	if (!headers.has('accept')) headers.set('accept', 'application/json');

	const response = await event.fetch(`${baseUrl()}${path}`, {
		...init,
		headers,
		redirect: 'manual'
	});
	copyBackendCookies(event, response);
	return response;
}

export async function backendJson(event, path, body, init = {}) {
	const headers = new Headers(init.headers);
	headers.set('content-type', 'application/json');
	return backendFetch(event, path, {
		...init,
		method: init.method || 'POST',
		headers,
		body: JSON.stringify(body ?? {})
	});
}

export async function requireAdmin(event) {
	const response = await backendFetch(event, '/api/admin/auth/me');
	if (!response.ok) throw redirect(303, '/login');
	const me = await response.json();
	if (!me.authenticated) throw redirect(303, '/login');
	return me;
}

export async function formError(response, fallback = 'Request failed.') {
	let message = fallback;
	try {
		const body = await response.json();
		message = body.error || body.message || fallback;
	} catch {
	}
	return fail(response.status, { error: message });
}
