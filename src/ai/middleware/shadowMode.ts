// Browser-compatible UUID generation
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export async function withShadow<T>(
	primary: () => Promise<T>,
	shadow: (() => Promise<T>) | null,
	log: (rec: any) => void
) {
	const id = generateUUID();
	const start = Date.now();
	const result = await primary();
	if (shadow) {
		shadow()
			.then((s) =>
				log({ id, kind: 'shadow', primaryMs: Date.now() - start, diff: diffOutputs(result, s) })
			)
			.catch((e) => log({ id, kind: 'shadow_error', error: String(e) }));
	}
	return result;
}

export function diffOutputs(a: any, b: any) {
	try {
		const sa = JSON.stringify(a);
		const sb = JSON.stringify(b);
		return { same: sa?.slice(0, 200) === sb?.slice(0, 200) };
	} catch {
		return { same: String(a).slice(0, 200) === String(b).slice(0, 200) };
	}
}


