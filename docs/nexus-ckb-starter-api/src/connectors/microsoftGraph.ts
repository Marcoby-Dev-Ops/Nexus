import { z } from "zod";

export const MsListDeltaResult = z.object({
  items: z.array(z.any()),
  deltaLink: z.string().optional(),
  nextLink: z.string().optional()
});
export type MsListDeltaResult = z.infer<typeof MsListDeltaResult>;

export interface GraphClient { getAccessToken(): Promise<string>; }

async function graphFetch<T>(token: string, url: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(url, { ...init, headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json", ...(init.headers||{}) } });
  if (!res.ok) { const text = await res.text(); throw new Error(`Graph error ${res.status}: ${text}`); }
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return await res.json() as T;
  // @ts-ignore
  return await res.arrayBuffer() as T;
}

export class MicrosoftGraphConnector {
  constructor(private auth: GraphClient){}
  async listDriveDelta(driveId: string, cursor?: string) {
    const token = await this.auth.getAccessToken();
    const base = `https://graph.microsoft.com/v1.0/drives/${driveId}/root/delta`;
    const url = cursor ? cursor : base;
    const json = await graphFetch<any>(token, url);
    return { items: json.value || [], deltaLink: json["@odata.deltaLink"], nextLink: json["@odata.nextLink"] };
  }
  async getFileBytes(driveId: string, itemId: string): Promise<Uint8Array> {
    const token = await this.auth.getAccessToken();
    const url = `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${itemId}/content`;
    const buf = await graphFetch<ArrayBuffer>(token, url);
    return new Uint8Array(buf);
  }
  async createUploadSession(driveId: string, pathWithFileName: string): Promise<{ uploadUrl: string }> {
    const token = await this.auth.getAccessToken();
    const url = `https://graph.microsoft.com/v1.0/drives/${driveId}/root:/${encodeURIComponent(pathWithFileName)}:/createUploadSession`;
    const body = JSON.stringify({ item: { "@microsoft.graph.conflictBehavior": "replace" }});
    const json = await graphFetch<any>(token, url, { method: "POST", body });
    return { uploadUrl: json.uploadUrl };
  }
  async uploadInChunks(uploadUrl: string, bytes: Uint8Array, chunk = 5 * 1024 * 1024): Promise<void> {
    let pos = 0;
    while (pos < bytes.length) {
      const end = Math.min(pos + chunk, bytes.length);
      const slice = bytes.slice(pos, end);
      const res = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Range": `bytes ${pos}-${end-1}/${bytes.length}` }, body: slice });
      if (!(res.status === 200 || res.status === 201 || res.status === 202)) { const text = await res.text(); throw new Error(`Upload failed: ${res.status} ${text}`); }
      pos = end;
    }
  }
  async graphSearch(siteId: string, query: string): Promise<any[]> {
    const token = await this.auth.getAccessToken();
    const url = `https://graph.microsoft.com/v1.0/search/query`;
    const body = { requests: [{ entityTypes: ["driveItem"], query: { queryString: query }, contentSources: [`/sites/${siteId}`] }] };
    const res = await fetch(url, { method: "POST", headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!res.ok) throw new Error(`Graph search failed: ${await res.text()}`);
    const data = await res.json();
    const hits = data?.value?.[0]?.hitsContainers?.[0]?.hits ?? [];
    return hits.map((h: any) => ({ name: h.resource?.name, webUrl: h.resource?.webUrl, driveId: h.resource?.parentReference?.driveId, itemId: h.resource?.id, mime: h.resource?.file?.mimeType }));
  }
}
