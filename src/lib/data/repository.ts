import { supabaseBrowser } from '$lib/supabase/client';

export interface Repository<T> {
	list(): Promise<T[]>;
	get(id: string): Promise<T | null>;
	create(input: Partial<T>): Promise<T>;
	update(id: string, patch: Partial<T>): Promise<T>;
	remove(id: string): Promise<void>;
}

export class SupabaseRepository<T extends { id: string }> implements Repository<T> {
	constructor(private table: string) {}
	private get db() {
		return supabaseBrowser();
	}

	async list(): Promise<T[]> {
		const { data, error } = await this.db.from(this.table).select('*');
		if (error) throw error;
		return (data ?? []) as T[];
	}
	async get(id: string): Promise<T | null> {
		const { data, error } = await this.db.from(this.table).select('*').eq('id', id).maybeSingle();
		if (error) throw error;
		return (data as T) ?? null;
	}
	async create(input: Partial<T>): Promise<T> {
		const { data, error } = await this.db.from(this.table).insert(input).select().single();
		if (error) throw error;
		return data as T;
	}
	async update(id: string, patch: Partial<T>): Promise<T> {
		const { data, error } = await this.db
			.from(this.table)
			.update(patch)
			.eq('id', id)
			.select()
			.single();
		if (error) throw error;
		return data as T;
	}
	async remove(id: string): Promise<void> {
		const { error } = await this.db.from(this.table).delete().eq('id', id);
		if (error) throw error;
	}
}
