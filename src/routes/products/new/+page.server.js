import { backendFetch, backendJson, formError, requireAdmin } from '$lib/server/backend.js';
import { redirect } from '@sveltejs/kit';

export async function load(event) {
	await requireAdmin(event);
	const response = await backendFetch(event, '/api/admin/products/categories');
	if (!response.ok) return { categories: [] };
	const body = await response.json();
	return { categories: body.categories ?? [] };
}

export const actions = {
	default: async (event) => {
		await requireAdmin(event);
		const form = await event.request.formData();
		const payload = JSON.parse(form.get('payload')?.toString() || '{}');
		const response = await backendJson(event, '/api/admin/products', payload);
		if (!response.ok) return formError(response, 'Unable to create product.');
		const product = await response.json();
		throw redirect(303, `/products/${product.id}`);
	}
};
