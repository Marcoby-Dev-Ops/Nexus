import { IndexChunk, KnowledgeDocMeta } from "../../core/types.js";
export interface IndexAdapter {
  upsertDocument(meta: KnowledgeDocMeta): Promise<void>;
  upsertChunks(chunks: IndexChunk[]): Promise<void>;
  search(queryEmbedding: number[], k: number, aclHashAllow: string[]): Promise<IndexChunk[]>;
}
