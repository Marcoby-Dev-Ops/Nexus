import type { Express } from 'express';
import { docxTemplaterMerge } from '../../services/templating/docx.js';
import { MicrosoftGraphConnector } from '../../connectors/microsoftGraph.js';
import { GoogleDriveConnector } from '../../connectors/googleDrive.js';
import { randomUUID } from 'crypto';

export function registerDocRoutes(app: Express, logger: any){
  app.post('/documents/generate', async (req, res) => {
    try {
      const { provider, template, data, destination } = req.body as any;
      if (!provider || !template || !destination) return res.status(400).json({ error: 'Missing fields' });

      if (provider === 'm365') {
        const token = process.env.MS_ACCESS_TOKEN;
        if (!token) return res.status(500).json({ error: 'MS access token not set' });
        const graph = new MicrosoftGraphConnector({ async getAccessToken(){ return token; } });
        const tBytes = await graph.getFileBytes(template.driveId, template.itemId);
        const merged = await docxTemplaterMerge(tBytes, data || {});
        const fileName = destination.fileName || `Generated-${randomUUID()}.docx`;
        const session = await graph.createUploadSession(destination.driveId, `${destination.path}/${fileName}`);
        await graph.uploadInChunks(session.uploadUrl, merged);
        return res.json({ ok: true, provider: 'm365', fileName });
      }

      if (provider === 'gdrive') {
        const g = new GoogleDriveConnector({
          clientId: process.env.GOOGLE_CLIENT_ID!, clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          redirectUri: process.env.GOOGLE_REDIRECT_URI!, refreshToken: process.env.GOOGLE_REFRESH_TOKEN!
        });
        const templateBytes = await g.getFileBytes(template.fileId);
        const merged = await docxTemplaterMerge(templateBytes, data || {});
        const name = destination.fileName || `Generated-${randomUUID()}.docx`;
        await g.uploadSimple(name, [destination.folderId], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', merged);
        return res.json({ ok: true, provider: 'gdrive', fileName: name });
      }

      return res.status(400).json({ error: 'Unsupported provider' });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });
}
