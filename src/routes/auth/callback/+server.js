import { completeLogin } from '$lib/server/auth0.js';

export async function GET(event) {
	await completeLogin(event);
}
