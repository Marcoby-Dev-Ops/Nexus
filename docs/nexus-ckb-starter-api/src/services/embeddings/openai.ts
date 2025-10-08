import 'dotenv/config';
const API_KEY = process.env.OPENAI_API_KEY!;
const API_BASE = process.env.OPENAI_API_BASE || "https://api.openai.com/v1";
const MODEL = process.env.EMBEDDING_MODEL || "text-embedding-3-small";
export async function embedTexts(texts: string[]): Promise<number[][]> {
  const res = await fetch(`${API_BASE}/embeddings`, { method: "POST", headers: { "Authorization": `Bearer ${API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ input: texts, model: MODEL }) });
  if (!res.ok) throw new Error(`Embedding error: ${res.status} ${await res.text()}`);
  const data = await res.json(); return data.data.map((d: any) => d.embedding as number[]);
}
