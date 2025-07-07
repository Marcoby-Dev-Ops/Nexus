/**
 * Live Business Health Orchestrator
 * Coordinates real-time KPI updates from all integrated data sources
 * Ensures business health scoring uses live data instead of mock data
 */

import { supabase } from '../core/supabase';
import { logger } from '../security/logger';
import { hubspotService } from './hubspotService';
import { apolloService } from './apolloService';
import { marcobyCloudService } from './marcobyCloudService';
import { cloudflareService } from './cloudflareService';
import { BusinessHealthService } from './businessHealthService';

export interface LiveDataSource {
  id: string;
  name: string;
  service: any;
  updateMethod: string;
  category: string[];
  priority: number;
  syncIntervalMinutes: number;
  lastSync?: string;
  isActive: boolean;
}

export interface SyncResult {
  sourceId: string;
  success: boolean;
  kpisUpdated: number;
  lastSync: string;
  error?: string;
}

export class LiveBusinessHealthOrchestrator {
  private businessHealthService: BusinessHealthService;
  private sources: LiveDataSource[];
  private syncInProgress = false;

  constructor() {
    this.businessHealthService = new BusinessHealthService();
    this.sources = [
      {
        id: 'hubspot',
        name: 'HubSpot CRM',
        service: hubspotService,
        updateMethod: 'updateBusinessHealthKPIs',
        category: ['sales', 'marketing'],
        priority: 1,
        syncIntervalMinutes: 60, // Sync every hour
        isActive: true
      },
      {
        id: 'apollo',
        name: 'Apollo Sales Intelligence',
        service: apolloService,
        updateMethod: 'updateBusinessHealthKPIs',
        category: ['sales'],
        priority: 2,
        syncIntervalMinutes: 120, // Sync every 2 hours
        isActive: true
      },
      {
        id: 'marcoby_cloud',
        name: 'Marcoby Cloud Infrastructure',
        service: marcobyCloudService,
        updateMethod: 'updateBusinessHealthKPIs',
        category: ['operations'],
        priority: 3,
        syncIntervalMinutes: 30, // Sync every 30 minutes
        isActive: true
      },
      {
        id: 'cloudflare',
        name: 'Cloudflare Analytics',
        service: cloudflareService,
        updateMethod: 'updateBusinessHealthKPIs',
        category: ['operations', 'marketing'],
        priority: 4,
        syncIntervalMinutes: 60, // Sync every hour
        isActive: true
      }
    ];
  }

  /**
   * Initialize live business health monitoring
   * Call this on app startup to begin real-time KPI tracking
   */
  async initialize(): Promise<void> {
    try {
      logger.info('Initializing Live Business Health Orchestrator');
      
      // Load last sync times from database
      await this.loadLastSyncTimes();
      
      // Perform initial sync of all sources
      await this.syncAllSources(true);
      
      // Set up periodic sync intervals
      this.setupPeriodicSync();
      
      logger.info('Live Business Health Orchestrator initialized successfully');
      
    } catch (error) {
      logger.error({ error }, 'Failed to initialize Live Business Health Orchestrator');
      throw error;
    }
  }

  /**
   * Sync all active data sources
   */
  async syncAllSources(forceSync = false): Promise<SyncResult[]> {
    if (this.syncInProgress && !forceSync) {
      logger.warn('Sync already in progress, skipping');
      return [];
    }

    this.syncInProgress = true;
    const results: SyncResult[] = [];

    try {
      logger.info({ sourceCount: this.sources.length }, 'Starting sync of all business health data sources');

      // Sort by priority (lower number = higher priority)
      const activeSources = this.sources.filter(s => s.isActive).sort((a, b) => a.priority - b.priority);

      // Sync each source
      for (const source of activeSources) {
        try {
          if (!forceSync && !this.shouldSync(source)) {
            logger.debug({ sourceId: source.id }, 'Skipping sync - not due yet');
            continue;
          }

          const result = await this.syncDataSource(source);
          results.push(result);

          // Small delay between syncs to avoid overwhelming APIs
          await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (error) {
          logger.error({ error, sourceId: source.id }, 'Failed to sync data source');
          results.push({
            sourceId: source.id,
            success: false,
            kpisUpdated: 0,
            lastSync: new Date().toISOString(),
            error: error.message
          });
        }
      }

      // Update last sync times
      await this.updateLastSyncTimes(results);

      logger.info({ 
        syncedSources: results.filter(r => r.success).length,
        totalSources: results.length,
        totalKPIsUpdated: results.reduce((sum, r) => sum + r.kpisUpdated, 0)
      }, 'Completed sync of business health data sources');

      return results;

    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Sync a single data source
   */
  private async syncDataSource(source: LiveDataSource): Promise<SyncResult> {
    const startTime = Date.now();
    
    try {
      logger.info({ sourceId: source.id, sourceName: source.name }, 'Syncing data source');

      // Get KPI count before sync
      const kpisBefore = await this.getKPICount(source.id);

      // Call the source's update method
      await source.service[source.updateMethod]();

      // Get KPI count after sync
      const kpisAfter = await this.getKPICount(source.id);
      const kpisUpdated = kpisAfter - kpisBefore;

      const result: SyncResult = {
        sourceId: source.id,
        success: true,
        kpisUpdated,
        lastSync: new Date().toISOString()
      };

      logger.info({ 
        sourceId: source.id,
        kpisUpdated,
        syncDuration: Date.now() - startTime
      }, 'Successfully synced data source');

      return result;

    } catch (error) {
      logger.error({ error, sourceId: source.id }, 'Failed to sync data source');
      
      return {
        sourceId: source.id,
        success: false,
        kpisUpdated: 0,
        lastSync: new Date().toISOString(),
        error: error.message
      };
    }
  }

  /**
   * Get current business health with live data
   */
  async getLiveBusinessHealth(orgId: string) {
    try {
      // Trigger a quick sync of high-priority sources if data is stale
      await this.syncIfStale();

      // Fetch the latest business health data
      const healthData = await this.businessHealthService.fetchBusinessHealthData(orgId);

      logger.info({ 
        orgId, 
        overallScore: healthData.overallScore,
        dataSources: healthData.dataSources,
        completionPercentage: healthData.completionPercentage
      }, 'Retrieved live business health data');

      return healthData;

    } catch (error) {
      logger.error({ error, orgId }, 'Failed to get live business health');
      throw error;
    }
  }

  /**
   * Force sync of specific data sources
   */
  async syncSources(sourceIds: string[]): Promise<SyncResult[]> {
    const results: SyncResult[] = [];
    
    for (const sourceId of sourceIds) {
      const source = this.sources.find(s => s.id === sourceId);
      if (source && source.isActive) {
        const result = await this.syncDataSource(source);
        results.push(result);
      }
    }

    await this.updateLastSyncTimes(results);
    return results;
  }

  /**
   * Check if a source should be synced based on its interval
   */
  private shouldSync(source: LiveDataSource): boolean {
    if (!source.lastSync) return true;

    const lastSyncTime = new Date(source.lastSync);
    const intervalMs = source.syncIntervalMinutes * 60 * 1000;
    const nextSyncTime = new Date(lastSyncTime.getTime() + intervalMs);

    return new Date() >= nextSyncTime;
  }

  /**
   * Sync high-priority sources if data is stale
   */
  private async syncIfStale(): Promise<void> {
    const staleSources = this.sources
      .filter(s => s.isActive && s.priority <= 2) // High priority sources
      .filter(s => this.shouldSync(s));

    if (staleSources.length > 0) {
      logger.info({ staleCount: staleSources.length }, 'Syncing stale high-priority sources');
      
      for (const source of staleSources) {
        try {
          await this.syncDataSource(source);
        } catch (error) {
          logger.warn({ error, sourceId: source.id }, 'Failed to sync stale source');
        }
      }
    }
  }

  /**
   * Set up periodic sync intervals
   */
  private setupPeriodicSync(): void {
    // Main sync every 30 minutes
    setInterval(() => {
      this.syncAllSources().catch(error => {
        logger.error({ error }, 'Periodic sync failed');
      });
    }, 30 * 60 * 1000);

    // High-priority sync every 15 minutes
    setInterval(() => {
      const highPrioritySources = this.sources
        .filter(s => s.isActive && s.priority <= 2)
        .map(s => s.id);
      
      this.syncSources(highPrioritySources).catch(error => {
        logger.error({ error }, 'High-priority sync failed');
      });
    }, 15 * 60 * 1000);

    logger.info('Set up periodic sync intervals');
  }

  /**
   * Load last sync times from database
   */
  private async loadLastSyncTimes(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('integration_sync_status')
        .select('integration_id, last_sync')
        .in('integration_id', this.sources.map(s => s.id));

      if (error) {
        logger.warn({ error }, 'Failed to load last sync times');
        return;
      }

      // Update sources with last sync times
      this.sources.forEach(source => {
        const syncData = data?.find(d => d.integration_id === source.id);
        if (syncData) {
          source.lastSync = syncData.last_sync;
        }
      });

    } catch (error) {
      logger.warn({ error }, 'Error loading last sync times');
    }
  }

  /**
   * Update last sync times in database
   */
  private async updateLastSyncTimes(results: SyncResult[]): Promise<void> {
    try {
      const updates = results
        .filter(r => r.success)
        .map(r => ({
          integration_id: r.sourceId,
          last_sync: r.lastSync,
          status: 'success',
          kpis_updated: r.kpisUpdated
        }));

      if (updates.length > 0) {
        const { error } = await supabase
          .from('integration_sync_status')
          .upsert(updates);

        if (error) {
          logger.warn({ error }, 'Failed to update sync times');
        }
      }

    } catch (error) {
      logger.warn({ error }, 'Error updating sync times');
    }
  }

  /**
   * Get KPI count for a specific source
   */
  private async getKPICount(sourceId: string): Promise<number> {
    try {
      const sourcePattern = `${sourceId}%`;
      
      const { count, error } = await supabase
        .from('ai_kpi_snapshots')
        .select('*', { count: 'exact', head: true })
        .like('source', sourcePattern)
        .gte('captured_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (error) {
        logger.warn({ error, sourceId }, 'Failed to get KPI count');
        return 0;
      }

      return count || 0;

    } catch (error) {
      logger.warn({ error, sourceId }, 'Error getting KPI count');
      return 0;
    }
  }

  /**
   * Get orchestrator status
   */
  getStatus() {
    return {
      activeSources: this.sources.filter(s => s.isActive).length,
      totalSources: this.sources.length,
      syncInProgress: this.syncInProgress,
      sources: this.sources.map(s => ({
        id: s.id,
        name: s.name,
        category: s.category,
        isActive: s.isActive,
        lastSync: s.lastSync,
        syncIntervalMinutes: s.syncIntervalMinutes
      }))
    };
  }
}

// Export singleton instance
export const liveBusinessHealthOrchestrator = new LiveBusinessHealthOrchestrator(); 