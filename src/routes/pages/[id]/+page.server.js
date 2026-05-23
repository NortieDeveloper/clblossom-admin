import { backendFetch, backendJson, formError, requireAdmin } from '$lib/server/backend.js';
import { redirect } from '@sveltejs/kit';

export async function load(event) {
	await requireAdmin(event);
	const id = event.params.id;
	const [pageResponse, activitiesResponse] = await Promise.all([
		backendFetch(event, `/api/admin/pages/${id}`),
		backendFetch(event, `/api/admin/activities?entityType=page&entityId=${id}&limit=20`)
	]);
	const body = pageResponse.ok ? await pageResponse.json() : {};
	return {
		page: body.page ?? { id, blocks: [] },
		books: body.books ?? [],
		activities: activitiesResponse.ok ? (await activitiesResponse.json()).activities ?? [] : []
	};
}

export const actions = {
	save: async (event) => {
		await requireAdmin(event);
		const form = await event.request.formData();
		const payload = JSON.parse(form.get('payload')?.toString() || '{}');
		const response = await backendJson(event, `/api/admin/pages/${event.params.id}`, payload, {
			method: 'PUT'
		});
		if (!response.ok) return formError(response, 'Unable to save page.');
		return { saved: true };
	},
	delete: async (event) => {
		await requireAdmin(event);
		const response = await backendFetch(event, `/api/admin/pages/${event.params.id}`, {
			method: 'DELETE'
		});
		if (!response.ok) return formError(response, 'Unable to delete page.');
		throw redirect(303, '/pages');
	}
};
