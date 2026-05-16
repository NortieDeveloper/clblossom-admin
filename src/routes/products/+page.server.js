import { backendFetch, backendJson, formError, requireAdmin } from '$lib/server/backend.js';

export async function load(event) {
	await requireAdmin(event);
	const response = await backendFetch(event, '/api/admin/products');
	return { products: response.ok ? (await response.json()).products : [] };
}

export const actions = {
	reorder: async (event) => {
		await requireAdmin(event);
		const form = await event.request.formData();
		const productIds = form
			.get('productIds')
			?.toString()
			.split(',')
			.map((id) => id.trim())
			.filter(Boolean);
		const response = await backendJson(event, '/api/admin/products/order', { productIds }, { method: 'PUT' });
		if (!response.ok) return formError(response, 'Unable to save product order.');

		return { productOrderSaved: true };
	}
};
