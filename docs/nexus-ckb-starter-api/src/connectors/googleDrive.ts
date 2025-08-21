import { google } from "googleapis";
export interface GoogleAuthConfig { clientId: string; clientSecret: string; redirectUri: string; refreshToken: string; }
export class GoogleDriveConnector {
  private drive;
  constructor(private cfg: GoogleAuthConfig){
    const oauth2 = new google.auth.OAuth2(cfg.clientId, cfg.clientSecret, cfg.redirectUri);
    oauth2.setCredentials({ refresh_token: cfg.refreshToken });
    this.drive = google.drive({ version: "v3", auth: oauth2 });
  }
  async getFileBytes(fileId: string, mimeType?: string): Promise<Uint8Array> {
    const file = await this.drive.files.get({ fileId, fields: "id, mimeType, name" });
    const mt = mimeType || file.data.mimeType;
    if (mt && mt.startsWith("application/vnd.google-apps")) {
      const alt = "text/plain";
      const res = await this.drive.files.export({ fileId, mimeType: alt }, { responseType: "arraybuffer" });
      return new Uint8Array(res.data as any);
    } else {
      const res = await this.drive.files.get({ fileId, alt: "media" }, { responseType: "arraybuffer" });
      return new Uint8Array(res.data as any);
    }
  }
  async uploadSimple(name: string, parents: string[], mimeType: string, data: Uint8Array) {
    await this.drive.files.create({ requestBody: { name, parents }, media: { mimeType, body: Buffer.from(data) as any } });
  }
  async driveSearch(query: string, driveId?: string) {
    const res = await this.drive.files.list({
      q: query, includeItemsFromAllDrives: true, supportsAllDrives: true, corpora: driveId ? "drive" : "user", driveId: driveId
    } as any);
    return res.data.files || [];
  }
}
