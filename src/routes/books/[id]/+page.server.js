import { backendFetch, backendJson, formError, requireAdmin } from '$lib/server/backend.js';
import { error, redirect } from '@sveltejs/kit';

export async function load(event) {
	await requireAdmin(event);
	const [response, activitiesResponse] = await Promise.all([
		backendFetch(event, `/api/admin/books/${event.params.id}`),
		backendFetch(event, `/api/admin/activities?entityType=book&entityId=${event.params.id}&limit=20`)
	]);
	if (response.status === 404) throw error(404, 'Book not found');
	if (!response.ok) throw error(response.status, 'Unable to load book');
	return {
		book: await response.json(),
		activities: activitiesResponse.ok ? (await activitiesResponse.json()).activities ?? [] : []
	};
}

export const actions = {
	save: async (event) => {
		await requireAdmin(event);
		const form = await event.request.formData();
		const payload = JSON.parse(form.get('payload')?.toString() || '{}');
		const response = await backendJson(event, `/api/admin/books/${event.params.id}`, payload, {
			method: 'PUT'
		});
		if (!response.ok) return formError(response, 'Unable to save book.');
		return { saved: true };
	},
	delete: async (event) => {
		await requireAdmin(event);
		const response = await backendFetch(event, `/api/admin/books/${event.params.id}`, {
			method: 'DELETE'
		});
		if (!response.ok) return formError(response, 'Unable to delete book.');
		throw redirect(303, '/books');
	}
};
