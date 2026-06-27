import { supabaseBrowser } from '$lib/supabase/client';
import { SupabaseStorageService } from '$lib/data/storage-service';

const storage = new SupabaseStorageService('media');

export interface Belonging {
	id: string;
	kind: 'purchase' | 'clothing';
	category: string;
	name: string;
	cost_paise: number | null;
	qty: number;
	acquired_on: string | null;
	image_path: string | null;
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

export async function uploadBelongingImage(file: File): Promise<string> {
	const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
	const path = `belongings/${crypto.randomUUID()}-${safe}`;
	await storage.upload(file, path);
	return path;
}

export function signedBelongingUrl(path: string): Promise<string> {
	return storage.signedUrl(path, 60 * 60 * 24 * 7);
}

export async function addBelonging(b: Partial<Belonging>): Promise<void> {
	// Only reference image_path when set, so adds keep working on a cloud DB
	// that hasn't had migration 0009 applied yet.
	const row: Record<string, unknown> = {
		kind: b.kind ?? 'purchase',
		category: b.category ?? 'Other',
		name: b.name ?? '',
		cost_paise: b.cost_paise ?? null,
		qty: b.qty ?? 1,
		acquired_on: b.acquired_on ?? null
	};
	if (b.image_path) row.image_path = b.image_path;
	const { error } = await supabaseBrowser().from('belongings').insert(row as never);
	if (error) throw error;
}

export async function removeBelonging(id: string): Promise<void> {
	await supabaseBrowser().from('belongings').delete().eq('id', id);
}
