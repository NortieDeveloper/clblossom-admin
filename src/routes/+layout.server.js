import { backendFetch } from '$lib/server/backend.js';

export async function load(event) {
	const response = await backendFetch(event, '/api/admin/auth/me');
	if (!response.ok) return { admin: { authenticated: false } };
	return { admin: await response.json() };
}
