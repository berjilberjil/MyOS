import type { Handle } from '@sveltejs/kit';
import { supabaseServer } from '$lib/server/supabase';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.supabase = supabaseServer(event);
	// getUser() validates the JWT with the auth server (getSession alone is not trusted).
	const {
		data: { user }
	} = await event.locals.supabase.auth.getUser();
	event.locals.user = user;

	return resolve(event, {
		filterSerializedResponseHeaders: (name) =>
			name === 'content-range' || name === 'x-supabase-api-version'
	});
};
