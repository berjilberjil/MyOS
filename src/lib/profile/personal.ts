import { supabaseBrowser } from '$lib/supabase/client';

// One-time-ish personal data, stored in profile.preferences (jsonb). Only weight
// tends to change. No new table needed — the profile row already exists.
export interface Personal {
	current_weight_kg: number | null;
	goal_weight_kg: number | null;
	height_cm: number | null;
	blood_group: string | null;
	dob: string | null;
	sex: string | null;
}

export const EMPTY_PERSONAL: Personal = {
	current_weight_kg: null,
	goal_weight_kg: null,
	height_cm: null,
	blood_group: null,
	dob: null,
	sex: null
};

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export async function getPersonal(): Promise<Personal> {
	const { data } = await supabaseBrowser().from('profile').select('preferences').maybeSingle();
	const prefs = (data?.preferences ?? {}) as Partial<Personal>;
	return { ...EMPTY_PERSONAL, ...prefs };
}

export async function savePersonal(p: Personal): Promise<void> {
	const sb = supabaseBrowser();
	const { data } = await sb.auth.getUser();
	const uid = data.user?.id;
	if (!uid) throw new Error('Not signed in');
	const { error } = await sb
		.from('profile')
		.upsert({ user_id: uid, preferences: p as unknown as Record<string, never> }, { onConflict: 'user_id' });
	if (error) throw error;
}
