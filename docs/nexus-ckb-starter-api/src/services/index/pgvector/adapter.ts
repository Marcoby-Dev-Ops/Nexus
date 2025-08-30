import { IndexAdapter } from "../IndexAdapter.js";
import { IndexChunk, KnowledgeDocMeta } from "../../../core/types.js";
import { Client } from "pg";
import { toSqlVector } from "./util.js";
export class PgVectorAdapter implements IndexAdapter {
  constructor(private client: Client, private dim: number){}
  async upsertDocument(meta: KnowledgeDocMeta): Promise<void> {
    await this.client.query(`
      INSERT INTO ckb_documents (file_id, drive_id, provider, title, mime, web_url, last_modified, acl_hash, domain, doc_type, taxonomy)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      ON CONFLICT (file_id) DO UPDATE SET
        title = EXCLUDED.title, mime = EXCLUDED.mime, web_url = EXCLUDED.web_url, last_modified = EXCLUDED.last_modified,
        acl_hash = EXCLUDED.acl_hash, domain = EXCLUDED.domain, doc_type = EXCLUDED.doc_type, taxonomy = EXCLUDED.taxonomy
    `, [ meta.pointer.fileId, meta.pointer.driveId, meta.pointer.provider, meta.title, meta.mime, meta.pointer.webUrl, meta.lastModified, meta.pointer.aclHash, meta.domain, meta.docType, meta.taxonomy ]);
  }
  async upsertChunks(chunks: IndexChunk[]): Promise<void> {
    const sql = `
      INSERT INTO ckb_chunks (id, file_id, heading_path, page_from, page_to, text, embedding, acl_hash)
      VALUES ${chunks.map((_,i)=>`($${i*8+1},$${i*8+2},$${i*8+3},$${i*8+4},$${i*8+5},$${i*8+6},$${i*8+7},$${i*8+8})`).join(",")}
      ON CONFLICT (id) DO UPDATE SET heading_path=EXCLUDED.heading_path, page_from=EXCLUDED.page_from, page_to=EXCLUDED.page_to, text=EXCLUDED.text, embedding=EXCLUDED.embedding, acl_hash=EXCLUDED.acl_hash
    `;
    const vals: any[] = [];
    for (const c of chunks) vals.push(c.id, c.fileId, c.headingPath ?? null, c.pageFrom ?? null, c.pageTo ?? null, c.text, toSqlVector(c.embedding), c.meta.pointer.aclHash);
    await this.client.query(sql, vals);
  }
  async search(qEmb: number[], k: number, aclHashAllow: string[]): Promise<IndexChunk[]> {
    const res = await this.client.query(`
      SELECT id, file_id, heading_path, page_from, page_to, text, acl_hash, 1 - (embedding <=> $1) AS score
      FROM ckb_chunks WHERE acl_hash = ANY($3) ORDER BY embedding <=> $1 LIMIT $2
    `, [toSqlVector(qEmb), k, aclHashAllow]);
    return res.rows.map(r => ({ id:r.id, fileId:r.file_id, headingPath:r.heading_path??undefined, pageFrom:r.page_from??undefined, pageTo:r.page_to??undefined, text:r.text, embedding:[], meta:{ pointer:{ provider:"m365", driveId:"", fileId:r.file_id, webUrl:"", aclHash:r.acl_hash }, title:"", mime:"", domain:[], docType:"record", lastModified:"", taxonomy:[] } }));
  }
}
