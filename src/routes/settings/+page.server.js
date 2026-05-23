import { backendFetch, backendJson, formError, requireAdmin } from '$lib/server/backend.js';

export async function load(event) {
	await requireAdmin(event);
	const response = await backendFetch(event, '/api/admin/navigation/header');
	const body = response.ok ? await response.json() : {};
	return {
		navigation: body.items ?? [],
		pages: body.pages ?? []
	};
}

export const actions = {
	saveNavigation: async (event) => {
		await requireAdmin(event);
		const form = await event.request.formData();
		const payload = JSON.parse(form.get('navigationPayload')?.toString() || '{}');
		const response = await backendJson(event, '/api/admin/navigation/header', payload, {
			method: 'PUT'
		});
		if (!response.ok) return formError(response, 'Unable to save navigation.');

		return { navigationSaved: true };
	},
	previewStripeImport: async (event) => {
		await requireAdmin(event);
		const response = await backendFetch(event, '/api/admin/products/stripe-import/preview');
		if (!response.ok) return formError(response, 'Unable to preview Stripe import.');

		return { stripeImportPreview: await response.json() };
	},
	runStripeImport: async (event) => {
		await requireAdmin(event);
		const response = await backendJson(event, '/api/admin/products/stripe-import', {});
		if (!response.ok) return formError(response, 'Unable to import Stripe products.');

		return { stripeImportResult: await response.json() };
	}
};
