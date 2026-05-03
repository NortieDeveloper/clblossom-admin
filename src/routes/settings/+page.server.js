import { requireAdmin } from '$lib/server/backend.js';

export async function load(event) {
	await requireAdmin(event);
	return {};
}
