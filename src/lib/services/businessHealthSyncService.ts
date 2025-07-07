import { supabase } from '../core/supabase';
import { logger } from '../security/logger';
import { hubspotService } from './hubspotService';
import { apolloService } from './apolloService';
import { marcobyCloudService } from './marcobyCloudService';

export interface SyncResult {
  success: boolean;
  source: string;
  kpisUpdated: number;
  errors?: string[];
}

export interface BusinessHealthSyncOptions {
  sources?: ('hubspot' | 'apollo' | 'marcoby_cloud')[];
  forceSync?: boolean;
  companyId?: string;
}

/**
 * Business Health Data Sync Service
 * Automatically syncs KPI data from integrated services into the business health system
 */
export class BusinessHealthSyncService {
  private isRunning = false;
  private lastSyncTime: Date | null = null;
  private syncInterval: NodeJS.Timeout | null = null;

  /**
   * Start automatic sync scheduler (runs every 15 minutes)
   */
  startAutoSync(intervalMinutes: number = 15): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(async () => {
      try {
        await this.syncAllSources();
      } catch (error) {
        logger.error({ error }, 'Auto sync failed');
      }
    }, intervalMinutes * 60 * 1000);

    logger.info({ intervalMinutes }, 'Started business health auto sync');
  }

  /**
   * Stop automatic sync scheduler
   */
  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    logger.info('Stopped business health auto sync');
  }

  /**
   * Sync data from all available sources
   */
  async syncAllSources(options: BusinessHealthSyncOptions = {}): Promise<SyncResult[]> {
    if (this.isRunning) {
      logger.warn('Sync already in progress, skipping');
      return [];
    }

    this.isRunning = true;
    const results: SyncResult[] = [];

    try {
      logger.info('Starting business health data sync');

      const sources = options.sources || ['hubspot', 'apollo', 'marcoby_cloud'];
      
      // Run syncs in parallel for better performance
      const syncPromises = sources.map(source => this.syncSource(source, options));
      const syncResults = await Promise.allSettled(syncPromises);

      syncResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({
            success: false,
            source: sources[index],
            kpisUpdated: 0,
            errors: [result.reason?.message || 'Unknown error']
          });
        }
      });

      this.lastSyncTime = new Date();
      logger.info({ 
        results: results.map(r => ({ source: r.source, success: r.success, kpisUpdated: r.kpisUpdated })),
        totalKpisUpdated: results.reduce((sum, r) => sum + r.kpisUpdated, 0)
      }, 'Business health sync completed');

    } catch (error) {
      logger.error({ error }, 'Business health sync failed');
      throw error;
    } finally {
      this.isRunning = false;
    }

    return results;
  }

  /**
   * Sync data from a specific source
   */
  private async syncSource(source: string, options: BusinessHealthSyncOptions): Promise<SyncResult> {
    try {
      switch (source) {
        case 'hubspot':
          return await this.syncHubSpotData(options);
        case 'apollo':
          return await this.syncApolloData(options);
        case 'marcoby_cloud':
          return await this.syncMarcobyCloudData(options);
        default:
          throw new Error(`Unknown source: ${source}`);
      }
    } catch (error) {
      logger.error({ error, source }, `Failed to sync ${source} data`);
      return {
        success: false,
        source,
        kpisUpdated: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Sync HubSpot CRM data
   */
  private async syncHubSpotData(options: BusinessHealthSyncOptions): Promise<SyncResult> {
    try {
      // Check if we should skip based on last sync time
      if (!options.forceSync && await this.shouldSkipSync('hubspot')) {
        return { success: true, source: 'hubspot', kpisUpdated: 0 };
      }

      await hubspotService.updateBusinessHealthKPIs();
      
      // Get count of updated KPIs
      const kpisUpdated = await this.getRecentKPICount('hubspot_api');

      return {
        success: true,
        source: 'hubspot',
        kpisUpdated
      };
    } catch (error) {
      logger.error({ error }, 'HubSpot sync failed');
      throw error;
    }
  }

  /**
   * Sync Apollo prospecting data
   */
  private async syncApolloData(options: BusinessHealthSyncOptions): Promise<SyncResult> {
    try {
      if (!options.forceSync && await this.shouldSkipSync('apollo')) {
        return { success: true, source: 'apollo', kpisUpdated: 0 };
      }

      await apolloService.updateBusinessHealthKPIs();
      
      const kpisUpdated = await this.getRecentKPICount('apollo_api');

      return {
        success: true,
        source: 'apollo',
        kpisUpdated
      };
    } catch (error) {
      logger.error({ error }, 'Apollo sync failed');
      throw error;
    }
  }

  /**
   * Sync Marcoby Cloud infrastructure data
   */
  private async syncMarcobyCloudData(options: BusinessHealthSyncOptions): Promise<SyncResult> {
    try {
      if (!options.forceSync && await this.shouldSkipSync('marcoby_cloud')) {
        return { success: true, source: 'marcoby_cloud', kpisUpdated: 0 };
      }

      await marcobyCloudService.updateBusinessHealthKPIs();
      
      const kpisUpdated = await this.getRecentKPICount('marcoby_cloud_api');

      return {
        success: true,
        source: 'marcoby_cloud',
        kpisUpdated
      };
    } catch (error) {
      logger.error({ error }, 'Marcoby Cloud sync failed');
      throw error;
    }
  }

  /**
   * Check if we should skip sync based on last sync time
   */
  private async shouldSkipSync(source: string): Promise<boolean> {
    try {
      const thirtyMinutesAgo = new Date();
      thirtyMinutesAgo.setMinutes(thirtyMinutesAgo.getMinutes() - 30);

      const { data, error } = await supabase
        .from('ai_kpi_snapshots')
        .select('captured_at')
        .ilike('source', `%${source}%`)
        .gte('captured_at', thirtyMinutesAgo.toISOString())
        .limit(1);

      if (error) {
        logger.error({ error, source }, 'Failed to check last sync time');
        return false; // Sync if we can't determine
      }

      return (data && data.length > 0);
    } catch (error) {
      logger.error({ error, source }, 'Error checking last sync time');
      return false;
    }
  }

  /**
   * Get count of recently updated KPIs from a source
   */
  private async getRecentKPICount(source: string): Promise<number> {
    try {
      const fiveMinutesAgo = new Date();
      fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);

      const { data, error } = await supabase
        .from('ai_kpi_snapshots')
        .select('id')
        .eq('source', source)
        .gte('captured_at', fiveMinutesAgo.toISOString());

      if (error) {
        logger.error({ error, source }, 'Failed to get recent KPI count');
        return 0;
      }

      return data?.length || 0;
    } catch (error) {
      logger.error({ error, source }, 'Error getting recent KPI count');
      return 0;
    }
  }

  /**
   * Get sync status and statistics
   */
  async getSyncStatus(): Promise<{
    isRunning: boolean;
    lastSyncTime: Date | null;
    autoSyncEnabled: boolean;
    recentSyncStats: Array<{
      source: string;
      lastSync: Date;
      kpiCount: number;
    }>;
  }> {
    const recentSyncStats = await Promise.all([
      this.getSourceSyncStats('hubspot_api'),
      this.getSourceSyncStats('apollo_api'),
      this.getSourceSyncStats('marcoby_cloud_api')
    ]);

    return {
      isRunning: this.isRunning,
      lastSyncTime: this.lastSyncTime,
      autoSyncEnabled: this.syncInterval !== null,
      recentSyncStats: recentSyncStats.filter(stat => stat !== null) as Array<{
        source: string;
        lastSync: Date;
        kpiCount: number;
      }>
    };
  }

  /**
   * Get sync statistics for a specific source
   */
  private async getSourceSyncStats(source: string): Promise<{
    source: string;
    lastSync: Date;
    kpiCount: number;
  } | null> {
    try {
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      const { data, error } = await supabase
        .from('ai_kpi_snapshots')
        .select('captured_at')
        .eq('source', source)
        .gte('captured_at', twentyFourHoursAgo.toISOString())
        .order('captured_at', { ascending: false });

      if (error || !data || data.length === 0) {
        return null;
      }

      return {
        source: source.replace('_api', ''),
        lastSync: new Date(data[0].captured_at),
        kpiCount: data.length
      };
    } catch (error) {
      logger.error({ error, source }, 'Error getting source sync stats');
      return null;
    }
  }

  /**
   * Manual trigger for immediate sync
   */
  async triggerManualSync(sources?: string[]): Promise<SyncResult[]> {
    return await this.syncAllSources({ 
      sources: sources as ('hubspot' | 'apollo' | 'marcoby_cloud')[], 
      forceSync: true 
    });
  }
}

// Export singleton instance
export const businessHealthSyncService = new BusinessHealthSyncService(); 