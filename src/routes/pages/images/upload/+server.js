import { backendFetch, requireAdmin } from '$lib/server/backend.js';
import { json } from '@sveltejs/kit';

export async function POST(event) {
	await requireAdmin(event);

	const form = await event.request.formData();
	const response = await backendFetch(event, '/api/admin/pages/images/upload', {
		method: 'POST',
		body: form
	});

	let body = {};
	try {
		body = await response.json();
	} catch {
	}

	return json(body, { status: response.status });
}
