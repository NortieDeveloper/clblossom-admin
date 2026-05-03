import { backendFetch, requireAdmin } from '$lib/server/backend.js';

export async function load(event) {
	await requireAdmin(event);
	const [productsResponse, eventsResponse] = await Promise.all([
		backendFetch(event, '/api/admin/products'),
		backendFetch(event, '/api/admin/events')
	]);

	return {
		products: productsResponse.ok ? (await productsResponse.json()).products : [],
		events: eventsResponse.ok ? (await eventsResponse.json()).events : []
	};
}
