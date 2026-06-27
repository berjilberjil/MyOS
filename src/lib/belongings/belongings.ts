import { supabaseBrowser } from '$lib/supabase/client';

export interface Belonging {
	id: string;
	kind: 'purchase' | 'clothing';
	category: string;
	name: string;
	cost_paise: number | null;
	qty: number;
	acquired_on: string | null;
	created_at: string;
}

export const PURCHASE_CATEGORIES = ['Gadget', 'Book', 'Electronics', 'Subscription', 'Other'];

export const CLOTHING_CATEGORIES = [
	'T-shirts',
	'Shirts',
	'Shorts',
	'Pants (out)',
	'Pants (home)',
	'Home sleeveless',
	'Socks',
	'Shoes',
	'Chappals',
	'Random'
];

export async function listBelongings(): Promise<Belonging[]> {
	const { data, error } = await supabaseBrowser()
		.from('belongings')
		.select('*')
		.order('created_at', { ascending: false });
	if (error) return []; // table may not exist on the cloud yet
	return (data ?? []) as Belonging[];
}

export async function addBelonging(b: Partial<Belonging>): Promise<void> {
	const { error } = await supabaseBrowser().from('belongings').insert({
		kind: b.kind ?? 'purchase',
		category: b.category ?? 'Other',
		name: b.name ?? '',
		cost_paise: b.cost_paise ?? null,
		qty: b.qty ?? 1,
		acquired_on: b.acquired_on ?? null
	});
	if (error) throw error;
}

export async function removeBelonging(id: string): Promise<void> {
	await supabaseBrowser().from('belongings').delete().eq('id', id);
}
