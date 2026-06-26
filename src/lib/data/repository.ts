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
		return (data ?? null) as T | null;
	}
	async create(input: Partial<T>): Promise<T> {
		// Cast at the supabase boundary: a generic wrapper over a dynamic table name
		// can't be inferred by supabase-js, so it widens insert args to `never`.
		const { data, error } = await this.db.from(this.table).insert(input as never).select().single();
		if (error) throw error;
		return data as T;
	}
	async update(id: string, patch: Partial<T>): Promise<T> {
		const { data, error } = await this.db
			.from(this.table)
			.update(patch as never)
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
