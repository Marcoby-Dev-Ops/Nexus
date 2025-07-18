import type { NexusIntegration, SyncResult as _SyncResult, SyncStatus } from '@/domains/integrations/lib/types';
export type SyncResult = _SyncResult;

export abstract class BaseIntegration implements NexusIntegration {
  abstract id: string;
  abstract name: string;
  abstract dataFields: string[];

  abstract fetchProviderData(options: { userId: string; fullSync?: boolean }): Promise<Record<string, any[]>>;

  abstract sync(options: { userId: string; fullSync?: boolean }): Promise<SyncResult>;

  async getSyncStatus(_userId: string): Promise<SyncStatus> {
    // Placeholder: fetch from integration_sync_status table
    // Replace with actual DB call
    return {
      lastSyncedAt: null,
      nextSyncAt: null,
      status: 'idle',
      dataPointsSynced: 0
    };
  }
} 