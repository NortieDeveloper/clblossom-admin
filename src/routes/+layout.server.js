import { backendFetch } from '$lib/server/backend.js';
import { getAuthSession } from '$lib/server/auth0.js';

export async function load(event) {
	const response = await backendFetch(event, '/api/admin/auth/me');
	if (!response.ok) return { admin: { authenticated: false } };
	const admin = await response.json();
	const session = getAuthSession(event);
	return {
		admin: {
			...admin,
			name: admin.name || session?.name,
			email: admin.email || session?.email
		}
	};
}
