import { backendFetch, backendJson, formError, requireAdmin } from '$lib/server/backend.js';
import { error, redirect } from '@sveltejs/kit';

export async function load(event) {
	await requireAdmin(event);
	const response = await backendFetch(event, `/api/admin/events/${event.params.id}`);
	if (response.status === 404) throw error(404, 'Event not found');
	if (!response.ok) throw error(response.status, 'Unable to load event');
	return { event: await response.json() };
}

export const actions = {
	save: async (event) => {
		await requireAdmin(event);
		const form = await event.request.formData();
		const payload = JSON.parse(form.get('payload')?.toString() || '{}');
		const response = await backendJson(event, `/api/admin/events/${event.params.id}`, payload, {
			method: 'PUT'
		});
		if (!response.ok) return formError(response, 'Unable to save event.');
		return { saved: true };
	},
	delete: async (event) => {
		await requireAdmin(event);
		const response = await backendFetch(event, `/api/admin/events/${event.params.id}`, {
			method: 'DELETE'
		});
		if (!response.ok) return formError(response, 'Unable to delete event.');
		throw redirect(303, '/events');
	}
};
