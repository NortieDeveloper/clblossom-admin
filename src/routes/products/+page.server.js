import { backendFetch, requireAdmin } from '$lib/server/backend.js';

export async function load(event) {
	await requireAdmin(event);
	const response = await backendFetch(event, '/api/admin/products');
	return { products: response.ok ? (await response.json()).products : [] };
}
