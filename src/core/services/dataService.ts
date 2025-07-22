/**
 * Centralized Data Service
 * Uses backend connector for all data fetching operations
 * Provides consistent error handling and retry logic
 */

import { backendConnector } from '../backendConnector';
import { supabase } from '../supabase';
import { logger } from '../auth/logger';

export interface DataServiceOptions {
  timeout?: number;
  retries?: number;
  cacheTime?: number;
  maxCacheSize?: number;
}

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  accessCount: number;
}

export class DataService {
  private cache = new Map<string, CacheEntry>();
  private defaultOptions: Required<DataServiceOptions> = {
    timeout: 30000,
    retries: 3,
    cacheTime: 60000, // 1 minute
    maxCacheSize: 1000
  };

  constructor(options: DataServiceOptions = {}) {
    this.defaultOptions = { ...this.defaultOptions, ...options };
    this.startCacheCleanup();
  }

  /**
   * Start periodic cache cleanup
   */
  private startCacheCleanup(): void {
    setInterval(() => {
      this.cleanupExpiredCache();
    }, 300000); // Clean up every 5 minutes
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupExpiredCache(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.defaultOptions.cacheTime) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.cache.delete(key));
    
    if (expiredKeys.length > 0) {
      logger.debug({ expiredCount: expiredKeys.length }, 'Cleaned up expired cache entries');
    }
  }

  /**
   * Fetch data from Supabase with caching and error handling
   */
  async fetchFromSupabase<T>(
    table: string,
    query: string,
    options: RequestInit = {},
    cacheKey?: string
  ): Promise<T> {
    const key = cacheKey || `${table}:${query}`;
    
    // Check cache first
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.defaultOptions.cacheTime) {
      cached.accessCount++;
      return cached.data;
    }

    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.defaultOptions.retries; attempt++) {
      try {
        const data = await backendConnector.request<T>('supabase', `/${table}?${query}`, {
          ...options,
          signal: AbortSignal.timeout(this.defaultOptions.timeout)
        });
        
        // Cache the result
        this.setCacheEntry(key, data);
        
        return data;
      } catch (error) {
        lastError = error as Error;
        logger.warn({ 
          table, 
          query, 
          attempt, 
          error: error instanceof Error ? error.message : String(error) 
        }, `Supabase fetch attempt ${attempt} failed`);
        
        if (attempt === this.defaultOptions.retries) {
          break;
        }
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }

    logger.error({ table, query, error: lastError }, 'Supabase fetch failed after all retries');
    throw lastError || new Error('Supabase fetch failed');
  }

  /**
   * Set cache entry with size management
   */
  private setCacheEntry<T>(key: string, data: T): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.defaultOptions.maxCacheSize) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].accessCount - b[1].accessCount);
      
      // Remove 20% of oldest entries
      const toRemove = Math.ceil(this.defaultOptions.maxCacheSize * 0.2);
      entries.slice(0, toRemove).forEach(([key]) => this.cache.delete(key));
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      accessCount: 1
    });
  }

  /**
   * Fetch data from Edge Functions
   */
  async fetchFromEdgeFunction<T>(
    functionName: string,
    body: any = {},
    options: RequestInit = {}
  ): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.defaultOptions.retries; attempt++) {
      try {
        return await backendConnector.request<T>('edge-functions', `/${functionName}`, {
          method: 'POST',
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(this.defaultOptions.timeout),
          ...options
        });
      } catch (error) {
        lastError = error as Error;
        logger.warn({ 
          functionName, 
          attempt, 
          error: error instanceof Error ? error.message : String(error) 
        }, `Edge function fetch attempt ${attempt} failed`);
        
        if (attempt === this.defaultOptions.retries) {
          break;
        }
        
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }

    logger.error({ functionName, error: lastError }, 'Edge function fetch failed after all retries');
    throw lastError || new Error('Edge function fetch failed');
  }

  /**
   * Fetch data from AI Chat service
   */
  async fetchFromAIChat<T>(
    message: string,
    conversationId?: string,
    metadata?: any
  ): Promise<T> {
    try {
      return await backendConnector.request<T>('ai-chat', '', {
        method: 'POST',
        body: JSON.stringify({
          message,
          conversationId,
          metadata
        }),
        signal: AbortSignal.timeout(this.defaultOptions.timeout)
      });
    } catch (error) {
      logger.error({ message, conversationId, error }, 'AI chat fetch failed');
      throw error;
    }
  }

  /**
   * Fetch business health data
   */
  async fetchBusinessHealth<T>(): Promise<T> {
    try {
      return await backendConnector.request<T>('business-health', '/health', {
        method: 'GET',
        signal: AbortSignal.timeout(this.defaultOptions.timeout)
      });
    } catch (error) {
      logger.error({ error }, 'Business health fetch failed');
      throw error;
    }
  }

  /**
   * Fetch user profile data
   */
  async fetchUserProfile(userId: string) {
    return this.fetchFromSupabase('user_profiles', `id=eq.${userId}&select=*`);
  }

  /**
   * Fetch user integrations
   */
  async fetchUserIntegrations(userId: string) {
    return this.fetchFromSupabase('user_integrations', `user_id=eq.${userId}&select=*`);
  }

  /**
   * Fetch notifications
   */
  async fetchNotifications(userId: string, limit = 10) {
    return this.fetchFromSupabase(
      'notifications',
      `user_id=eq.${userId}&order=created_at.desc&limit=${limit}&select=*`
    );
  }

  /**
   * Fetch inbox items
   */
  async fetchInboxItems(userId: string, filters: any = {}, limit = 50, offset = 0) {
    try {
          // Use supabase directly
    let query = supabase
        .from('ai_inbox_items')
        .select('*', { count: 'exact' });

      // Apply filters
      if (filters.search) {
        query = query.or(`subject.ilike.%${filters.search}%,body_preview.ilike.%${filters.search}%,sender_email.ilike.%${filters.search}%`);
      }
      if (filters.account_id) {
        query = query.eq('integration_id', filters.account_id);
      }
      if (filters.is_read !== undefined) {
        query = query.eq('is_read', filters.is_read);
      }
      if (filters.is_important !== undefined) {
        query = query.eq('is_important', filters.is_important);
      }
      if (filters.source_type) {
        query = query.eq('source_type', filters.source_type);
      }
      if (filters.date_from) {
        query = query.gte('item_timestamp', filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte('item_timestamp', filters.date_to);
      }

      // Apply pagination
      query = query.range(offset, offset + limit - 1);
      query = query.order('item_timestamp', { ascending: false });

      const { data, error, count } = await query;

      if (error) {
        logger.error({ error }, 'Error fetching inbox items from database');
        throw error;
      }

      return {
        items: data || [],
        total: count || 0
      };

    } catch (error) {
      logger.error({ error }, 'Error in fetchInboxItems');
      throw error;
    }
  }

  /**
   * Fetch dashboard metrics
   */
  async fetchDashboardMetrics(userId: string) {
    return this.fetchFromEdgeFunction('dashboard-metrics', { userId });
  }

  /**
   * Fetch recent activities
   */
  async fetchRecentActivities(userId: string, limit = 20) {
    return this.fetchFromSupabase(
      'activities',
      `user_id=eq.${userId}&order=created_at.desc&limit=${limit}&select=*`
    );
  }

  /**
   * Clear cache for specific key or all cache
   */
  clearCache(key?: string) {
    if (key) {
      this.cache.delete(key);
      logger.debug({ key }, 'Cleared specific cache entry');
    } else {
      this.cache.clear();
      logger.debug('Cleared all cache entries');
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    const entries = Array.from(this.cache.entries());
    const now = Date.now();
    
    const validEntries = entries.filter(([_, value]) => 
      now - value.timestamp < this.defaultOptions.cacheTime
    );
    
    const expiredEntries = entries.filter(([_, value]) => 
      now - value.timestamp >= this.defaultOptions.cacheTime
    );
    
    const totalSize = entries.reduce((size, [_, value]) => 
      size + JSON.stringify(value.data).length, 0
    );
    
    const avgAccessCount = entries.length > 0 
      ? entries.reduce((sum, [_, value]) => sum + value.accessCount, 0) / entries.length 
      : 0;

    return {
      totalEntries: entries.length,
      validEntries: validEntries.length,
      expiredEntries: expiredEntries.length,
      cacheSizeBytes: totalSize,
      averageAccessCount: avgAccessCount,
      maxCacheSize: this.defaultOptions.maxCacheSize,
      cacheTimeMs: this.defaultOptions.cacheTime
    };
  }

  /**
   * Check if backend services are healthy
   */
  isHealthy(): boolean {
    return backendConnector.isSystemHealthy();
  }

  /**
   * Get backend service status
   */
  getServiceStatus() {
    return backendConnector.getServices();
  }

  /**
   * Preload data into cache
   */
  async preloadData<T>(key: string, dataLoader: () => Promise<T>): Promise<void> {
    try {
      const data = await dataLoader();
      this.setCacheEntry(key, data);
      logger.debug({ key }, 'Preloaded data into cache');
    } catch (error) {
      logger.error({ key, error }, 'Failed to preload data');
    }
  }
}

// Export singleton instance
export const dataService = new DataService(); 