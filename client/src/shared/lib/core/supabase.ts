// Legacy compatibility shim: provide a small supabase-like query builder backed
// by the app's `database` wrapper / `api-client` helpers. This allows older
// components to continue using the familiar chainable API while we migrate
// progressively to the canonical `database` service.

import { selectData, selectOne } from '@/lib/api-client';

type QueryBuilderState = {
	table: string;
	columns?: string;
	filters: Record<string, unknown>;
	order?: { column: string; ascending?: boolean };
	limit?: number;
	head?: boolean;
	count?: string | boolean;
	single?: boolean;
};

function createBuilder(table: string) {
	const state: QueryBuilderState = { table, filters: {} };

	const builder: any = {
		select(columns?: string, opts?: any) {
			state.columns = columns;
			if (opts && typeof opts === 'object') {
				if (opts.head) state.head = true;
				if (opts.count) state.count = opts.count;
			}
			return builder;
		},
		eq(col: string, val: unknown) {
			state.filters[col] = val;
			return builder;
		},
		order(col: string, opts?: { ascending?: boolean }) {
			state.order = { column: col, ascending: opts?.ascending };
			return builder;
		},
		limit(n: number) {
			state.limit = n;
			return builder;
		},
		or(cond: string) {
			// Preserve raw `or` condition for server-side interpretation
			state.filters['or'] = cond;
			return builder;
		},
		single() {
			state.single = true;
			return builder;
		},
		// Allow awaiting the builder directly (thenable) so `await supabase.from(...).select(...)
		// .eq(...).single()` works as before.
		async then(resolve: any, reject: any) {
			try {
				if (state.single) {
					const res = await selectOne(state.table, state.filters);
					const out = { data: res.data ?? null, error: res.success ? null : res.error };
					if (resolve) return resolve(out);
					return out;
				}

				const resp = await selectData({ table: state.table, columns: state.columns, filters: state.filters, limit: state.limit });

				if (state.head) {
					// Prefer server-provided count metadata when present
					const count = (resp as any).metadata?.count ?? (Array.isArray(resp.data) ? resp.data.length : 0);
					const out = { count };
					if (resolve) return resolve(out);
					return out;
				}

				const out = { data: resp.data ?? [], error: resp.success ? null : resp.error };
				if (resolve) return resolve(out);
				return out;
			} catch (err) {
				if (reject) return reject(err);
				throw err;
			}
		}
	};

	return builder;
}

export const supabase = {
	from(table: string) {
		return createBuilder(table);
	}
} as any;

export default supabase;
