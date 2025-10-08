export interface ChunkingOptions { maxChars?: number; overlapChars?: number; }
export function simpleChunk(text: string, opts: ChunkingOptions = {}): string[] {
  const max = opts.maxChars ?? 3000, overlap = opts.overlapChars ?? 300;
  const out: string[] = []; let i=0; while (i<text.length){ const end=Math.min(i+max,text.length); out.push(text.slice(i,end)); if(end>=text.length) break; i=end-overlap; if(i<0) i=0; } return out;
}
