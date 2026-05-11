import { backendFetch, requireAdmin } from '$lib/server/backend.js';

export async function load(event) {
	await requireAdmin(event);
	const [productsResponse, eventsResponse, activitiesResponse] = await Promise.all([
		backendFetch(event, '/api/admin/products'),
		backendFetch(event, '/api/admin/events'),
		backendFetch(event, '/api/admin/activities?limit=15')
	]);

	return {
		products: productsResponse.ok ? (await productsResponse.json()).products : [],
		events: eventsResponse.ok ? (await eventsResponse.json()).events : [],
		activities: activitiesResponse.ok ? (await activitiesResponse.json()).activities : []
	};
}
