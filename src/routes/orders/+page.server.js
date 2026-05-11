import { backendFetch, backendJson, formError, requireAdmin } from '$lib/server/backend.js';

export async function load(event) {
	await requireAdmin(event);
	const response = await backendFetch(event, '/api/admin/orders');
	return { orders: response.ok ? (await response.json()).orders : [] };
}

export const actions = {
	markFulfilled: async (event) => {
		await requireAdmin(event);
		const form = await event.request.formData();
		const id = form.get('id')?.toString();
		if (!id) return { error: 'Order id is required.' };

		const response = await backendJson(event, `/api/admin/orders/${id}/mark-fulfilled`, {});
		if (!response.ok) return formError(response, 'Unable to mark order fulfilled.');

		return { order: await response.json() };
	}
};
