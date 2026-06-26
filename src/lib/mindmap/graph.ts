import type { SupabaseClient } from '@supabase/supabase-js';
import { supabaseBrowser } from '$lib/supabase/client';

function db(): SupabaseClient {
	return supabaseBrowser() as unknown as SupabaseClient;
}

export interface ModuleNode {
	key: string;
	label: string;
	href: string;
	count: number;
}

const MODULES: { key: string; label: string; href: string; tables: string[] }[] = [
	{ key: 'finance', label: 'Finance', href: '/finance', tables: ['accounts', 'transactions'] },
	{ key: 'journal', label: 'Journal', href: '/journal', tables: ['journal_entries'] },
	{ key: 'todos', label: 'To-dos', href: '/todos', tables: ['todos'] },
	{ key: 'goals', label: 'Goals', href: '/goals', tables: ['goals'] },
	{ key: 'health', label: 'Health', href: '/health', tables: ['health_logs'] },
	{ key: 'fitness', label: 'Fitness', href: '/fitness', tables: ['fitness_logs'] },
	{ key: 'notes', label: 'Notes', href: '/notes', tables: ['notes'] }
];

async function countTable(table: string): Promise<number> {
	const { count, error } = await db().from(table).select('*', { count: 'exact', head: true });
	if (error) return 0;
	return count ?? 0;
}

export async function moduleNodes(): Promise<ModuleNode[]> {
	return Promise.all(
		MODULES.map(async (m) => {
			const counts = await Promise.all(m.tables.map(countTable));
			return { key: m.key, label: m.label, href: m.href, count: counts.reduce((a, b) => a + b, 0) };
		})
	);
}

export interface GraphLink {
	id: string;
	source_type: string;
	source_id: string;
	relation: string;
	target_type: string;
	target_id: string;
}

// Any accumulated cross-entity links (the mindmap backbone).
export async function entityLinks(): Promise<GraphLink[]> {
	const { data, error } = await db().from('links').select('*').limit(200);
	if (error) return [];
	return (data ?? []) as GraphLink[];
}
