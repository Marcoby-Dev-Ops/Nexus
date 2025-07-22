import type { BaseIntegration } from '@/domains/integrations/lib/baseIntegration';
import type { SyncResult } from '@/domains/integrations/lib/types';

// Mock database client for now - replace with actual implementation
const db = {
  integration_sync_status: {
    upsert: async (data: any, keys: string[]) => {
      console.log('Mock upsert:', data, keys);
      return data;
    }
  }
};

export async function syncIntegration({
  integration,
  userId,
  fullSync = false
}: {
  integration: BaseIntegration;
  userId: string;
  fullSync?: boolean;
}): Promise<SyncResult> {
  const startedAt = new Date();

  try {
    // Use the integration's own sync method
    const result = await integration.sync({ userId, fullSync });
    
    // Update sync status
    await db.integration_sync_status.upsert({
      user_id: userId,
      integration_id: integration.id,
      last_synced_at: new Date(),
      status: 'idle',
      data_points_synced: result.dataPoints,
      updated_at: new Date()
    }, ['user_id', 'integration_id']);

    return result;
  } catch (error) {
    console.error('Sync failed:', error);
    return {
      success: false,
      syncedFields: [],
      dataPoints: 0,
      error: error instanceof Error ? error.message : 'Unknown sync error',
      startedAt,
      finishedAt: new Date()
    };
  }
}

export async function triggerManualSync({
  integrationId,
  userId,
  fullSync = false
}: {
  integrationId: string;
  userId: string;
  fullSync?: boolean;
}): Promise<{ success: boolean; error?: string }> {
  try {
    // Get the integration class from the registry
    const integrationClassRegistry: Record<string, any> = {
      'google-workspace': (await import('./GoogleWorkspaceIntegration')).GoogleWorkspaceIntegration,
      'microsoft-365': (await import('./Microsoft365Integration')).Microsoft365Integration,
      'dropbox': (await import('./DropboxIntegration')).DropboxIntegration,
      'slack': (await import('./SlackIntegration')).SlackIntegration,
      'hubspot': (await import('./hubspotIntegration')).HubSpotIntegration,
      'notion': (await import('./NotionIntegration')).NotionIntegration,
      'asana': (await import('./AsanaIntegration')).AsanaIntegration,
      'trello': (await import('./TrelloIntegration')).TrelloIntegration,
      'github': (await import('./GitHubIntegration')).GitHubIntegration,
      'zendesk': (await import('./ZendeskIntegration')).ZendeskIntegration,
    };

    const IntegrationClass = integrationClassRegistry[integrationId];
    if (!IntegrationClass) {
      return { success: false, error: `Integration ${integrationId} not found` };
    }

    // Create integration instance (handle different constructor signatures)
    let integration: BaseIntegration;
    if (integrationId === 'hubspot') {
      // HubSpot has a different constructor
      integration = new IntegrationClass({} as any);
    } else {
      integration = new IntegrationClass();
    }

    const result = await syncIntegration({ integration, userId, fullSync });

    return { success: result.success, error: result.error };
  } catch (error) {
    console.error('Manual sync failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown sync error' 
    };
  }
} 