import mammoth from "mammoth";
import pdfParse from "pdf-parse";
export async function extractTextFromDocx(bytes: Uint8Array): Promise<string> {
  const res = await (mammoth as any).extractRawText({ buffer: Buffer.from(bytes) }); return res.value || "";
}
export async function extractTextFromPdf(bytes: Uint8Array): Promise<string> {
  const res = await (pdfParse as any)(Buffer.from(bytes)); return res.text || "";
}
