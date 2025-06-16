/* eslint-disable */
// @ts-nocheck

import fs from 'node:fs/promises';
import path from 'node:path';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { createClient } from '@supabase/supabase-js';

// Load env vars
const supabaseUrl = process.env.SUPABASE_URL as string;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

// Change the directory path if your runbooks live elsewhere
const RUNBOOK_DIR = './runbooks/ops';
const ORG_ID: string | null = null; // Populate to scope embeddings to a tenant

async function main() {
  const files = await fs.readdir(RUNBOOK_DIR);
  const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 800, chunkOverlap: 60 });
  const embedder = new OpenAIEmbeddings({ modelName: 'text-embedding-3-small' });

  for (const file of files) {
    const raw = await fs.readFile(path.join(RUNBOOK_DIR, file), 'utf8');
    const chunks = await splitter.splitText(raw);
    const vectors = await embedder.embedDocuments(chunks);

    // Upsert chunks to avoid duplicates when rerunning the script
    const rows = chunks.map((chunk, i) => ({
      org_id: ORG_ID,
      source: file,
      chunk,
      embedding: vectors[i] as any,
    }));

    const { error } = await supabase.from('ai_operations_docs').upsert(rows);
    if (error) {
      console.error(`Failed to upsert ${file}:`, error);
    } else {
      console.log(`✓ ${file} → ${chunks.length} chunks`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
}); 