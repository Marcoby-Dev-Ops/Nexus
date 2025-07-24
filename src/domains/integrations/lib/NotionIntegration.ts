import { BaseIntegration } from '@/domains/integrations/lib/baseIntegration';
import type { SyncResult } from '@/domains/integrations/lib/baseIntegration';
import { syncIntegration } from '@/domains/integrations/lib/syncService';

export class NotionIntegration extends BaseIntegration {
  id = 'notion';
  name = 'Notion';
  dataFields = ['pages', 'databases', 'users', 'comments', 'tasks', 'files'];

  async fetchProviderData({ userId: userId, fullSync: fullSync }: { userId: string; fullSync?: boolean }): Promise<Record<string, any[]>> {
    // TODO: Implement actual Notion API fetch logic
    return {
      pages: [],
      databases: [],
      users: [],
      comments: [],
      tasks: [],
      files: []
    };
  }

  async sync(options: { userId: string; fullSync?: boolean }): Promise<SyncResult> {
    return syncIntegration({ integration: this, ...options });
  }
} 