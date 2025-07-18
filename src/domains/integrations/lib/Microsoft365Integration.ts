import { BaseIntegration } from '@/domains/integrations/lib/baseIntegration';
import type { SyncResult } from '@/domains/integrations/lib/baseIntegration';
import { syncIntegration } from '@/domains/integrations/lib/syncService';

export class Microsoft365Integration extends BaseIntegration {
  id = 'microsoft-365';
  name = 'Microsoft 365';
  dataFields = ['emails', 'calendarEvents', 'files', 'contacts', 'teams', 'tasks', 'notes'];

  async fetchProviderData({ userId: _userId, fullSync: _fullSync }: { userId: string; fullSync?: boolean }): Promise<Record<string, any[]>> {
    // TODO: Implement actual Microsoft 365 API fetch logic
    return {
      emails: [],
      calendarEvents: [],
      files: [],
      contacts: [],
      teams: [],
      tasks: [],
      notes: []
    };
  }

  async sync(options: { userId: string; fullSync?: boolean }): Promise<SyncResult> {
    return syncIntegration({ integration: this, ...options });
  }
} 