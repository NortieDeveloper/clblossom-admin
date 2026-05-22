import { backendFetch, backendJson, formError, requireAdmin } from '$lib/server/backend.js';

export async function load(event) {
	await requireAdmin(event);
	const [homepageResponse, activitiesResponse] = await Promise.all([
		backendFetch(event, '/api/admin/homepage'),
		backendFetch(event, '/api/admin/activities?entityType=homepage&entityId=00000000-0000-0000-0000-000000000000&limit=20')
	]);
	const body = homepageResponse.ok ? await homepageResponse.json() : {};
	return {
		homepage: body.homepage ?? { blocks: [] },
		books: body.books ?? [],
		activities: activitiesResponse.ok ? (await activitiesResponse.json()).activities ?? [] : []
	};
}

export const actions = {
	save: async (event) => {
		await requireAdmin(event);
		const form = await event.request.formData();
		const payload = JSON.parse(form.get('payload')?.toString() || '{}');
		const response = await backendJson(event, '/api/admin/homepage', payload, { method: 'PUT' });
		if (!response.ok) return formError(response, 'Unable to save homepage.');
		return { saved: true };
	}
};
