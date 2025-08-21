import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
export async function docxTemplaterMerge(templateBytes: Uint8Array, data: Record<string, any>): Promise<Uint8Array> {
  const zip = new PizZip(templateBytes);
  const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
  doc.setData(data); try { doc.render(); } catch (e: any) { throw new Error(`DOCX merge failed: ${e.message}`); }
  return doc.getZip().generate({ type: "uint8array" });
}
