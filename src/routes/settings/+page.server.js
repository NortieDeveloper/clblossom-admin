import { backendFetch, backendJson, formError, requireAdmin } from '$lib/server/backend.js';

export async function load(event) {
	await requireAdmin(event);
	return {};
}

export const actions = {
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
