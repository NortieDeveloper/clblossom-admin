import { logout } from '$lib/server/auth0.js';
import { backendFetch } from '$lib/server/backend.js';
import { redirect } from '@sveltejs/kit';

export async function load(event) {
	const response = await backendFetch(event, '/api/admin/auth/me');
	if (response.ok) {
		const me = await response.json();
		if (me.authenticated) throw redirect(303, '/');
	}
	return { error: event.url.searchParams.get('error') };
}

export const actions = {
	logout: async (event) => {
		logout(event);
	}
};
