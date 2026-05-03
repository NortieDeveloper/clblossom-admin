import { backendFetch, backendJson, formError } from '$lib/server/backend.js';
import { redirect } from '@sveltejs/kit';

export async function load(event) {
	const response = await backendFetch(event, '/api/admin/auth/me');
	if (response.ok) {
		const me = await response.json();
		if (me.authenticated) throw redirect(303, '/');
	}
	return {};
}

export const actions = {
	login: async (event) => {
		const form = await event.request.formData();
		const response = await backendJson(event, '/api/admin/auth/login', {
			password: form.get('password')?.toString()
		});

		if (!response.ok) return formError(response, 'Unable to sign in.');
		throw redirect(303, '/');
	},
	logout: async (event) => {
		await backendFetch(event, '/api/admin/auth/logout', { method: 'POST' });
		throw redirect(303, '/login');
	}
};
