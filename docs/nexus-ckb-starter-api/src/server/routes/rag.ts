import type { Express } from 'express';
import { MicrosoftGraphConnector } from '../../connectors/microsoftGraph.js';
import { GoogleDriveConnector } from '../../connectors/googleDrive.js';
import { extractTextFromDocx, extractTextFromPdf } from '../../services/convert/extractText.js';
import { simpleChunk } from '../../services/chunking/chunker.js';
import { embedTexts } from '../../services/embeddings/openai.js';
import { Client } from 'pg';
import { PgVectorAdapter } from '../../services/index/pgvector/adapter.js';
import { cosine } from '../../services/math/similarity.js';

function guessMime(name: string): string {
  const lower = (name || '').toLowerCase();
  if (lower.endsWith('.docx')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  if (lower.endsWith('.pdf')) return 'application/pdf';
  if (lower.endsWith('.txt')) return 'text/plain';
  return 'application/octet-stream';
}

export function registerRagRoutes(app: Express, logger: any){
  app.post('/rag/query', async (req, res) => {
    try {
      const { mode, provider, query, scope, k = 6 } = req.body as any;
      if (!query || !provider) return res.status(400).json({ error: 'Missing query/provider' });

      if (mode === 'customer_index') {
        const client = new Client({ connectionString: process.env.DATABASE_URL });
        await client.connect();
        const index = new PgVectorAdapter(client, Number(process.env.PGVECTOR_DIM || '1536'));
        const [qEmb] = await embedTexts([query]);
        const chunks = await index.search(qEmb, k, scope?.aclAllow ?? ['public']);
        await client.end();
        return res.json({ mode, provider, k, results: chunks.map(c => ({ fileId: c.fileId, headingPath: c.headingPath, text: c.text.slice(0, 1200) })) });
      }

      let hits: any[] = [];
      if (provider === 'ms') {
        const token = process.env.MS_ACCESS_TOKEN;
        if (!token) return res.status(500).json({ error: 'MS access token not set' });
        const ms = new MicrosoftGraphConnector({ async getAccessToken(){ return token; } });
        if (!scope?.siteId) return res.status(400).json({ error: 'scope.siteId required for ms' });
        hits = await ms.graphSearch(scope.siteId, query);
        hits = hits.slice(0, 5);
        const [qEmb] = await embedTexts([query]);
        const candidates: any[] = [];
        for (const h of hits) {
          const bytes = await ms.getFileBytes(h.driveId, h.itemId);
          const mt = h.mime || guessMime(h.name || '');
          let text = '';
          if (mt.includes('wordprocessingml')) text = await extractTextFromDocx(bytes);
          else if (mt.includes('pdf')) text = await extractTextFromPdf(bytes);
          else text = new TextDecoder().decode(bytes);
          for (const chunk of simpleChunk(text)) candidates.push({ source: h.webUrl, name: h.name, text: chunk });
        }
        const embeddings = await embedTexts(candidates.map(c => c.text));
        const scored = candidates.map((c, i) => ({ ...c, score: cosine(embeddings[i], qEmb) })).sort((a,b)=>b.score-a.score).slice(0, k);
        return res.json({ mode: 'search_only', provider, k, results: scored });
      }

      if (provider === 'gdrive') {
        const g = new GoogleDriveConnector({
          clientId: process.env.GOOGLE_CLIENT_ID!, clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          redirectUri: process.env.GOOGLE_REDIRECT_URI!, refreshToken: process.env.GOOGLE_REFRESH_TOKEN!
        });
        const list = await g.driveSearch(`fullText contains '${String(query).replace("'"," ")}'`);
        hits = (list || []).slice(0, 5);
        const [qEmb] = await embedTexts([query]);
        const candidates: any[] = [];
        for (const h of hits) {
          const bytes = await g.getFileBytes(h.id!, h.mimeType || undefined);
          const mt = h.mimeType || guessMime(h.name || '');
          let text = '';
          if (mt.includes('wordprocessingml')) text = await extractTextFromDocx(bytes);
          else if (mt.includes('pdf')) text = await extractTextFromPdf(bytes);
          else text = new TextDecoder().decode(bytes);
          for (const chunk of simpleChunk(text)) candidates.push({ source: `https://drive.google.com/file/d/${h.id}/view`, name: h.name, text: chunk });
        }
        const embeddings = await embedTexts(candidates.map(c => c.text));
        const scored = candidates.map((c, i) => ({ ...c, score: cosine(embeddings[i], qEmb) })).sort((a,b)=>b.score-a-score?1:-1).slice(0, k);
        // Fix sort typo
        const sorted = candidates.map((c, i) => ({ ...c, score: cosine(embeddings[i], qEmb) })).sort((a,b)=>b.score-a.score).slice(0, k);
        return res.json({ mode: 'search_only', provider, k, results: sorted });
      }

      return res.status(400).json({ error: 'Unsupported provider' });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });
}
