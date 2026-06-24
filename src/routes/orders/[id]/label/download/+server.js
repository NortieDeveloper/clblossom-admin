import { redirect } from '@sveltejs/kit';
import { backendFetch, requireAdmin } from '$lib/server/backend.js';

export async function GET(event) {
	await requireAdmin(event);
	const response = await backendFetch(event, `/api/admin/orders/${event.params.id}/label/download`);
	if (response.status >= 300 && response.status < 400) {
		const location = response.headers.get('location');
		if (location) throw redirect(303, location);
	}

	throw redirect(303, '/orders');
}
