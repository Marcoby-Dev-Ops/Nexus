import LRU from 'lru-cache';
import { NexusAIGatewayService } from '@/ai/services/NexusAIGatewayService';

// Placeholder vector store interfaces (wire to postgres/pgvector elsewhere)
export async function upsertVectors(_tenantId: string, _items: Array<{ id: string; vector: number[] }>) {
	return true;
}

export async function searchVectors(_tenantId: string, _queryVector: number[], _k: number) {
	return [] as Array<{ id: string; text: string; score: number }>;
}

const ai = new NexusAIGatewayService();

const embCache = new LRU<string, number[]>({ max: 5000 });

export async function embed(text: string, tenantId: string) {
	const key = tenantId + ':' + text;
	if (embCache.has(key)) return embCache.get(key)!;
	const res = await ai.generateEmbeddings({ text, tenantId, model: 'bge-m3' });
	if (!res.success || !res.data) return [] as number[];
	embCache.set(key, res.data.embedding);
	return res.data.embedding;
}

export async function ragQuery(query: string, tenantId: string) {
	const qv = await embed(query, tenantId);
	const docs = await searchVectors(tenantId, qv, 20);
	const reranked = await ai.rerankDocuments({
		query,
		documents: docs.map((d) => d.text),
		tenantId,
	});
	if (!reranked.success || !reranked.data) return [] as Array<{ id: string; text: string; score: number }>;
	return reranked.data.results
		.slice(0, 8)
		.map(({ index, score }) => ({ ...docs[index], score }));
}


