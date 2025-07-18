import { BaseIntegration } from '@/domains/integrations/lib/baseIntegration';
import type { SyncResult } from '@/domains/integrations/lib/baseIntegration';
import { syncIntegration } from '@/domains/integrations/lib/syncService';

export class TrelloIntegration extends BaseIntegration {
  id = 'trello';
  name = 'Trello';
  dataFields = ['boards', 'cards', 'lists', 'members', 'labels', 'checklists', 'attachments', 'comments'];

  async fetchProviderData({ userId: _userId, fullSync: _fullSync }: { userId: string; fullSync?: boolean }): Promise<Record<string, any[]>> {
    // TODO: Implement actual Trello API fetch logic
    return {
      boards: [],
      cards: [],
      lists: [],
      members: [],
      labels: [],
      checklists: [],
      attachments: [],
      comments: []
    };
  }

  async sync(options: { userId: string; fullSync?: boolean }): Promise<SyncResult> {
    return syncIntegration({ integration: this, ...options });
  }
} 