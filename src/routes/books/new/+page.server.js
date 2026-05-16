import { backendJson, formError, requireAdmin } from '$lib/server/backend.js';
import { redirect } from '@sveltejs/kit';

export async function load(event) {
	await requireAdmin(event);
	return {};
}

export const actions = {
	default: async (event) => {
		await requireAdmin(event);
		const form = await event.request.formData();
		const payload = JSON.parse(form.get('payload')?.toString() || '{}');
		const response = await backendJson(event, '/api/admin/books', payload);
		if (!response.ok) return formError(response, 'Unable to create book.');
		const book = await response.json();
		throw redirect(303, `/books/${book.id}`);
	}
};
