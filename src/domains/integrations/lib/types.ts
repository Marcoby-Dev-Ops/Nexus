export interface SyncResult {
  success: boolean;
  syncedFields: string[];
  dataPoints: number;
  error?: string;
  startedAt: Date;
  finishedAt: Date;
}

export interface SyncStatus {
  lastSyncedAt: Date | null;
  nextSyncAt: Date | null;
  status: 'idle' | 'syncing' | 'error';
  error?: string;
  dataPointsSynced: number;
}

export interface NexusIntegration {
  id: string;
  name: string;
  dataFields: string[];
  sync: (options: { userId: string; fullSync?: boolean }) => Promise<SyncResult>;
  getSyncStatus: (userId: string) => Promise<SyncStatus>;
  // Optionally: webhook handler, disconnect, etc.
} 