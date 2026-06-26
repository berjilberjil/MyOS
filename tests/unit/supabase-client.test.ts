import { describe, it, expect, vi } from 'vitest';

vi.mock('$env/static/public', () => ({
	PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
	PUBLIC_SUPABASE_ANON_KEY: 'anon'
}));

describe('supabaseBrowser', () => {
	it('returns the same instance twice (singleton)', async () => {
		const { supabaseBrowser } = await import('$lib/supabase/client');
		expect(supabaseBrowser()).toBe(supabaseBrowser());
	});
});
