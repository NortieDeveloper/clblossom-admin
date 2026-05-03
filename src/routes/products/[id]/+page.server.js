import { backendFetch, backendJson, formError, requireAdmin } from '$lib/server/backend.js';
import { error, redirect } from '@sveltejs/kit';

export async function load(event) {
	await requireAdmin(event);
	const [productResponse, categoriesResponse] = await Promise.all([
		backendFetch(event, `/api/admin/products/${event.params.id}`),
		backendFetch(event, '/api/admin/products/categories')
	]);
	const response = productResponse;
	if (response.status === 404) throw error(404, 'Product not found');
	if (!response.ok) throw error(response.status, 'Unable to load product');
	const product = await response.json();
	const categories = categoriesResponse.ok ? (await categoriesResponse.json()).categories ?? [] : [];
	return { product, categories };
}

export const actions = {
	save: async (event) => {
		await requireAdmin(event);
		const form = await event.request.formData();
		const payload = JSON.parse(form.get('payload')?.toString() || '{}');
		const response = await backendJson(event, `/api/admin/products/${event.params.id}`, payload, {
			method: 'PUT'
		});
		if (!response.ok) return formError(response, 'Unable to save product.');
		return { saved: true };
	},
	delete: async (event) => {
		await requireAdmin(event);
		const response = await backendFetch(event, `/api/admin/products/${event.params.id}`, {
			method: 'DELETE'
		});
		if (!response.ok) return formError(response, 'Unable to delete product.');
		throw redirect(303, '/products');
	}
};
