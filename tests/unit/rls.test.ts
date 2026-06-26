import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';

// Integration test against the local Supabase stack. Skipped unless
// SUPABASE_ANON_KEY is provided (so the default unit run doesn't need Docker).
const URL = process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321';
const ANON = process.env.SUPABASE_ANON_KEY ?? '';

async function userClient(email: string) {
	const c = createClient(URL, ANON);
	await c.auth.signUp({ email, password: 'Passw0rd!test' });
	await c.auth.signInWithPassword({ email, password: 'Passw0rd!test' });
	return c;
}

describe.skipIf(!ANON)('RLS isolation', () => {
	it('a user cannot read another user rows', async () => {
		const stamp = `${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
		const a = await userClient(`a_${stamp}@t.test`);
		const { error: insErr } = await a.from('links').insert({
			source_type: 'goal',
			source_id: crypto.randomUUID(),
			relation: 'funds',
			target_type: 'txn',
			target_id: crypto.randomUUID()
		});
		expect(insErr).toBeNull();

		const b = await userClient(`b_${stamp}@t.test`);
		const { data } = await b.from('links').select('*');
		expect(data).toEqual([]); // B sees none of A's rows
	});
});
