import { backendFetch, backendJson, formError, requireAdmin } from '$lib/server/backend.js';
import { redirect } from '@sveltejs/kit';

export async function load(event) {
	await requireAdmin(event);
	const response = await backendFetch(event, '/api/admin/pages');
	const body = response.ok ? await response.json() : {};
	return {
		pages: body.pages ?? []
	};
}

export const actions = {
	create: async (event) => {
		await requireAdmin(event);
		const form = await event.request.formData();
		const payload = {
			title: form.get('title')?.toString() ?? '',
			slug: form.get('slug')?.toString() ?? '',
			metaDescription: form.get('metaDescription')?.toString() ?? ''
		};
		const response = await backendJson(event, '/api/admin/pages', payload);
		if (!response.ok) return formError(response, 'Unable to create page.');
		const page = await response.json();
		throw redirect(303, `/pages/${page.id}`);
	}
};
