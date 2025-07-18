import { BaseIntegration } from '@/domains/integrations/lib/baseIntegration';
import type { SyncResult } from '@/domains/integrations/lib/baseIntegration';
import { syncIntegration } from '@/domains/integrations/lib/syncService';

export class AsanaIntegration extends BaseIntegration {
  id = 'asana';
  name = 'Asana';
  dataFields = ['tasks', 'projects', 'users', 'teams', 'stories', 'tags', 'attachments'];

  async fetchProviderData({ userId: _userId, fullSync: _fullSync }: { userId: string; fullSync?: boolean }): Promise<Record<string, any[]>> {
    // TODO: Implement actual Asana API fetch logic
    // Return an object with keys matching dataFields and values as arrays of records
    return {
      tasks: [],
      projects: [],
      users: [],
      teams: [],
      stories: [],
      tags: [],
      attachments: []
    };
  }

  async sync(options: { userId: string; fullSync?: boolean }): Promise<SyncResult> {
    // Use the generic syncIntegration service
    return syncIntegration({ integration: this, ...options });
  }
} 