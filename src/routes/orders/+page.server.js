import { backendFetch, backendJson, formError, requireAdmin } from '$lib/server/backend.js';

export async function load(event) {
	await requireAdmin(event);
	const [ordersResponse, packagesResponse] = await Promise.all([
		backendFetch(event, '/api/admin/orders'),
		backendFetch(event, '/api/admin/orders/label-packages')
	]);
	return {
		orders: ordersResponse.ok ? (await ordersResponse.json()).orders : [],
		labelPackages: packagesResponse.ok ? (await packagesResponse.json()).packages : []
	};
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
	},
	previewLabelRates: async (event) => {
		await requireAdmin(event);
		const form = await event.request.formData();
		const id = form.get('id')?.toString();
		const packageData = parsePackageData(form.get('packageData')?.toString());
		if (!id) return { error: 'Order id is required.' };
		if (!packageData.packageId) return { error: 'Package is required.' };

		const response = await backendJson(event, `/api/admin/orders/${id}/label-rates`, packageData);
		if (!response.ok) return labelActionError(response, 'Unable to retrieve label rates.');

		const body = await response.json();
		return { labelRates: { orderId: id, ...packageData, ...body } };
	},
	purchaseLabel: async (event) => {
		await requireAdmin(event);
		const form = await event.request.formData();
		const id = form.get('id')?.toString();
		const rateId = form.get('rateId')?.toString();
		const shipmentId = form.get('shipmentId')?.toString();
		const packageId = form.get('packageId')?.toString();
		const packageName = form.get('packageName')?.toString();
		if (!id) return { error: 'Order id is required.' };
		if (!rateId) return { error: 'Shipping service is required.' };

		const response = await backendJson(event, `/api/admin/orders/${id}/purchase-label`, {
			rateId,
			shipmentId,
			packageId,
			packageName
		});
		if (!response.ok) return labelActionError(response, 'Unable to purchase label.');

		return { order: await response.json() };
	}
};

function parsePackageData(raw) {
	if (!raw) return {};
	try {
		const parsed = JSON.parse(raw);
		return {
			packageId: parsed.objectId?.toString(),
			packageName: parsed.name?.toString()
		};
	} catch {
		return {};
	}
}

async function labelActionError(response, fallback) {
	if (response.status >= 500) {
		let message = fallback;
		try {
			const body = await response.json();
			message = body.error || body.message || fallback;
		} catch {
		}
		return { error: message };
	}
	return formError(response, fallback);
}
