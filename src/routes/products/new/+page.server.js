import { backendFetch, backendJson, formError, requireAdmin } from '$lib/server/backend.js';
import { redirect } from '@sveltejs/kit';

export async function load(event) {
	await requireAdmin(event);
	const [categoriesResponse, componentOptionsResponse] = await Promise.all([
		backendFetch(event, '/api/admin/products/categories'),
		backendFetch(event, '/api/admin/products/component-options')
	]);
	const categories = categoriesResponse.ok ? (await categoriesResponse.json()).categories ?? [] : [];
	const componentOptions = componentOptionsResponse.ok ? (await componentOptionsResponse.json()).variants ?? [] : [];
	return { categories, componentOptions };
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
