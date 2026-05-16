import { backendFetch, backendJson, formError, requireAdmin } from '$lib/server/backend.js';

export async function load(event) {
	await requireAdmin(event);
	const response = await backendFetch(event, '/api/admin/books');
	return { books: response.ok ? (await response.json()).books : [] };
}

export const actions = {
	reorder: async (event) => {
		await requireAdmin(event);
		const form = await event.request.formData();
		const bookIds = form
			.get('bookIds')
			?.toString()
			.split(',')
			.map((id) => id.trim())
			.filter(Boolean);
		const response = await backendJson(event, '/api/admin/books/order', { bookIds }, { method: 'PUT' });
		if (!response.ok) return formError(response, 'Unable to save book order.');

		return { bookOrderSaved: true };
	}
};
