import { startLogin } from '$lib/server/auth0.js';

export function GET(event) {
	startLogin(event);
}
