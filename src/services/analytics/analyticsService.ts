/**
 * Analytics Service
 * Provides centralized analytics functionality for the application
 */

import { supabase } from '@/lib/supabase';
import { logger } from '@/shared/utils/logger.ts';

export interface AnalyticsEvent {
  id: string;
  eventtype: string;
  user_id?: string;
  session_id?: string;
  properties: Record<string, any>;
  timestamp: Date;
  source?: string;
  version?: string;
}

export interface AnalyticsMetrics {
  totalEvents: number;
  uniqueUsers: number;
  eventTypes: Record<string, number>;
  timeRange: {
    start: Date;
    end: Date;
  };
  topEvents: Array<{ eventtype: string; count: number }>;
  userEngagement: {
    activeUsers: number;
    averageEventsPerUser: number;
  };
}

export interface AnalyticsBatchEvent {
  events: Omit<AnalyticsEvent, 'id'>[];
  batchSize: number;
  timestamp: Date;
}

class AnalyticsService {
  private sessionId: string;
  private eventQueue: Omit<AnalyticsEvent, 'id'>[] = [];
  private batchSize = 10;
  private flushInterval = 30000; // 30 seconds
  private isFlushing = false;
  private analyticsTableExists = false;
  private isInitialized = false;
  private tableCheckPromise: Promise<void> | null = null;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.startBatchProcessing();
    // Don't check analytics table immediately - do it lazily when first needed
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Initialize the service when first needed
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.checkAnalyticsTable();
      this.isInitialized = true;
    }
  }

  /**
   * Check if analytics table exists - with caching to prevent multiple checks
   */
  private async checkAnalyticsTable(): Promise<void> {
    // If we already have a check in progress, wait for it
    if (this.tableCheckPromise) {
      await this.tableCheckPromise;
      return;
    }

    // Create a new check promise
    this.tableCheckPromise = this.performTableCheck();
    await this.tableCheckPromise;
  }

  /**
   * Perform the actual table check
   */
  private async performTableCheck(): Promise<void> {
    try {
      // Check if user is authenticated before trying to access analytics_events
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // No authenticated user, assume table exists but we can't access it
        this.analyticsTableExists = true;
        logger.info('No authenticated user, will attempt to use analytics_events table when user logs in');
        return;
      }

      // Try to query the analytics_events table to see if it exists
      const { error } = await supabase
        .from('analytics_events') // Check analytics_events table first
        .select('id')
        .limit(1);

      if (error) {
        if (error.code === '42P01') {
          // Table doesn't exist, use activities table instead
          this.analyticsTableExists = false;
          logger.warn('analytics_events table not found, using activities table for analytics');
        } else if (error.code === '42501' || error.code === '403') {
          // Permission denied - table exists but we can't access it
          // This is likely due to RLS policies, but we'll still try to use it
          this.analyticsTableExists = true;
          logger.info('analytics_events table found (permission check failed), will attempt to use it for analytics');
        } else {
          // Other error - assume table exists and try to use it
          this.analyticsTableExists = true;
          logger.info('analytics_events table found and will be used for analytics');
        }
      } else {
        this.analyticsTableExists = true;
        logger.info('analytics_events table found and will be used for analytics');
      }
    } catch (error) {
      // If we can't determine table existence, assume it exists and try to use it
      this.analyticsTableExists = true;
      logger.warn({ error }, 'Could not determine analytics table existence, assuming analytics_events exists');
    } finally {
      // Clear the promise so future calls can check again if needed
      this.tableCheckPromise = null;
    }
  }

  /**
   * Start batch processing for analytics events
   */
  private startBatchProcessing(): void {
    setInterval(() => {
      this.flushEventQueue();
    }, this.flushInterval);
  }

  /**
   * Add event to queue for batch processing
   */
  private addToQueue(event: Omit<AnalyticsEvent, 'id'>): void {
    this.eventQueue.push(event);
    
    // Flush immediately if queue is full
    if (this.eventQueue.length >= this.batchSize) {
      this.flushEventQueue();
    }
  }

  /**
   * Flush queued events to database
   */
  private async flushEventQueue(): Promise<void> {
    if (this.isFlushing || this.eventQueue.length === 0) return;
    
    this.isFlushing = true;
    const eventsToFlush = [...this.eventQueue];
    this.eventQueue = [];

    try {
      if (this.analyticsTableExists) {
        // Use analytics_events table with correct column names
        const { error } = await supabase
          .from('analytics_events')
          .insert(eventsToFlush.map(event => ({
            user_id: event.user_id || null,
            eventtype: event.eventtype,
            properties: event.properties,
            timestamp: event.timestamp.toISOString(),
            session_id: event.session_id,
            source: event.source || 'web',
            version: event.version || '1.0.0'
          })));

        if (error) {
          logger.error({ error, eventCount: eventsToFlush.length }, 'Failed to insert analytics events');
        } else {
          logger.debug({ eventCount: eventsToFlush.length }, 'Analytics events flushed to analytics_events table');
        }
      } else {
        // Fallback to activities table
        const { error } = await supabase
          .from('activities')
          .insert(eventsToFlush.map(event => ({
            userid: event.user_id || '',
            type: event.eventtype,
            title: event.eventtype,
            source: event.source || 'web',
            description: JSON.stringify(event.properties),
            metadata: event.properties,
            occurredat: event.timestamp.toISOString(),
          })));

        if (error) {
          logger.error({ error, eventCount: eventsToFlush.length }, 'Failed to insert analytics events to activities table');
        } else {
          logger.debug({ eventCount: eventsToFlush.length }, 'Analytics events flushed to activities table');
        }
      }
    } catch (error) {
      logger.error({ error, eventCount: eventsToFlush.length }, 'Error in analytics service');
    } finally {
      this.isFlushing = false;
    }
  }

  /**
   * Track an analytics event
   */
  async trackEvent(
    eventType: string,
    properties: Record<string, any> = {},
    userId?: string,
    source?: string
  ): Promise<void> {
    await this.ensureInitialized();
    
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    
    // If no user is authenticated and no userId provided, skip tracking
    if (!user && !userId) {
      logger.debug({ eventType }, 'Skipping analytics event - no authenticated user and no userId provided');
      return;
    }
    
    const event: Omit<AnalyticsEvent, 'id'> = {
      eventtype: eventType,
      user_id: userId || user?.id,
      session_id: this.sessionId,
      properties,
      timestamp: new Date(),
      source: source || 'web',
      version: '1.0.0'
    };

    this.addToQueue(event);
  }

  /**
   * Track event (alias for trackEvent for backward compatibility)
   */
  async track(eventType: string, properties: Record<string, any> = {}, userId?: string): Promise<void> {
    return this.trackEvent(eventType, properties, userId);
  }

  /**
   * Track an analytics event immediately (bypasses queue)
   */
  async trackEventImmediate(
    eventType: string,
    properties: Record<string, any> = {},
    userId?: string,
    source?: string
  ): Promise<void> {
    await this.ensureInitialized();
    
    const event: Omit<AnalyticsEvent, 'id'> = {
      eventtype: eventType,
      user_id: userId,
      session_id: this.sessionId,
      properties,
      timestamp: new Date(),
      source: source || 'web',
      version: '1.0.0'
    };

    try {
      if (this.analyticsTableExists) {
        // Use analytics_events table with correct column names
        const { error } = await supabase
          .from('analytics_events')
          .insert({
            user_id: event.user_id || null,
            eventtype: event.eventtype,
            properties: event.properties,
            timestamp: event.timestamp.toISOString(),
            session_id: event.session_id,
            source: event.source || 'web',
            version: event.version || '1.0.0'
          });

        if (error) {
          logger.error({ error, event }, 'Failed to insert analytics event immediately');
        } else {
          logger.debug({ event }, 'Analytics event inserted immediately to analytics_events table');
        }
      } else {
        // Fallback to activities table
        const { error } = await supabase
          .from('activities')
          .insert({
            userid: event.user_id || '',
            type: event.eventtype,
            title: event.eventtype,
            source: event.source || 'web',
            description: JSON.stringify(event.properties),
            metadata: event.properties,
            occurredat: event.timestamp.toISOString(),
          });

        if (error) {
          logger.error({ error, event }, 'Failed to insert analytics event to activities table');
        } else {
          logger.debug({ event }, 'Analytics event inserted immediately to activities table');
        }
      }
    } catch (error) {
      logger.error({ error, event }, 'Error in immediate analytics tracking');
    }
  }

  /**
   * Get analytics metrics for a date range
   */
  async getMetrics(
    startDate: Date,
    endDate: Date,
    userId?: string
  ): Promise<AnalyticsMetrics> {
    await this.ensureInitialized();
    
    try {
      if (this.analyticsTableExists) {
        // Use analytics_events table
        let query = supabase
          .from('analytics_events')
          .select('*')
          .gte('timestamp', startDate.toISOString())
          .lte('timestamp', endDate.toISOString());

        if (userId) {
          query = query.eq('user_id', userId);
        }

        const { data: events, error } = await query;

        if (error) {
          logger.error({ error, startDate, endDate, userId }, 'Failed to fetch analytics metrics');
          throw error;
        }

        return this.calculateMetrics(events || [], startDate, endDate);
      } else {
        // Fallback to activities table
        let query = supabase
          .from('activities')
          .select('*')
          .gte('occurredat', startDate.toISOString())
          .lte('occurredat', endDate.toISOString());

        if (userId) {
          query = query.eq('userid', userId);
        }

        const { data: activities, error } = await query;

        if (error) {
          logger.error({ error, startDate, endDate, userId }, 'Failed to fetch analytics metrics from activities');
          throw error;
        }

        // Convert activities to analytics events format
        const events = (activities || []).map(activity => ({
          id: activity.id,
          eventtype: activity.type,
          user_id: activity.userid,
          properties: activity.metadata || {},
          timestamp: new Date(activity.occurredat),
          source: activity.source || 'web',
          version: '1.0.0'
        }));

        return this.calculateMetrics(events, startDate, endDate);
      }
    } catch (error) {
      logger.error({ error, startDate, endDate, userId }, 'Error getting analytics metrics');
      throw error;
    }
  }

  /**
   * Track page view
   */
  async trackPageView(page: string, userId?: string, properties: Record<string, any> = {}): Promise<void> {
    await this.trackEvent('page_view', { 
      page, 
      url: typeof window !== 'undefined' ? window.location.href : '',
      referrer: typeof document !== 'undefined' ? document.referrer : '',
      ...properties 
    }, userId);
  }

  /**
   * Track user action
   */
  async trackUserAction(action: string, properties: Record<string, any> = {}, userId?: string): Promise<void> {
    await this.trackEvent('user_action', { 
      action, 
      element: properties.element,
      context: properties.context,
      ...properties 
    }, userId);
  }

  /**
   * Track feature usage
   */
  async trackFeatureUsage(feature: string, properties: Record<string, any> = {}, userId?: string): Promise<void> {
    await this.trackEvent('feature_usage', { 
      feature, 
      usagecount: properties.usage_count || 1,
      ...properties 
    }, userId);
  }

  /**
   * Track error
   */
  async trackError(error: Error, context: Record<string, any> = {}, userId?: string): Promise<void> {
    await this.trackEvent('error', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      ...context
    }, userId);
  }

  /**
   * Track performance metric
   */
  async trackPerformance(metric: string, value: number, properties: Record<string, any> = {}, userId?: string): Promise<void> {
    await this.trackEvent('performance', {
      metric,
      value,
      unit: properties.unit || 'ms',
      ...properties
    }, userId);
  }

  /**
   * Get session analytics
   */
  async getSessionAnalytics(sessionId: string): Promise<AnalyticsEvent[]> {
    try {
      const { data: events, error } = await supabase
        .from('activities')
        .select('*')
        .eq('source', 'web') // Use source as session identifier since session_id doesn't exist
        .order('occurred_at', { ascending: true });

      if (error) {
        throw new Error(`Failed to get session analytics: ${error.message}`);
      }

      // Transform activities to AnalyticsEvent format
      return (events || []).map((event: any) => ({
        id: event.id,
        eventtype: event.type || event.event_type || 'unknown',
        user_id: event.user_id,
        session_id: event.source || 'web', // Use source as session_id
        properties: event.metadata || event.properties || {},
        timestamp: new Date(event.occurred_at || event.timestamp),
        source: event.source || 'web',
        version: '1.0.0'
      }));
    } catch (error) {
      logger.error({ sessionId, error }, 'Failed to get session analytics');
      return [];
    }
  }

  /**
   * Get user analytics
   */
  async getUserAnalytics(userId: string, days: number = 30): Promise<AnalyticsMetrics> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.getMetrics(startDate, endDate, userId);
  }

  /**
   * Force flush all queued events
   */
  async forceFlush(): Promise<void> {
    await this.flushEventQueue();
  }

  /**
   * Get queue status
   */
  getQueueStatus(): { queueLength: number; isFlushing: boolean; lastFlush: Date | null } {
    return {
      queueLength: this.eventQueue.length,
      isFlushing: this.isFlushing,
      lastFlush: null // Could track this if needed
    };
  }

  private calculateMetrics(events: AnalyticsEvent[], startDate: Date, endDate: Date): AnalyticsMetrics {
    const eventTypes: Record<string, number> = {};
    const uniqueUsers = new Set<string>();
    const eventCounts: Record<string, number> = {};

    events.forEach(event => {
      const eventType = event.eventtype;
      eventTypes[eventType] = (eventTypes[eventType] || 0) + 1;
      eventCounts[eventType] = (eventCounts[eventType] || 0) + 1;
      if (event.user_id) {
        uniqueUsers.add(event.user_id);
      }
    });

    // Get top events
    const topEvents = Object.entries(eventCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([event_type, count]) => ({ event_type, count }));

    const totalEvents = events.length;
    const uniqueUsersCount = uniqueUsers.size;
    const averageEventsPerUser = uniqueUsersCount > 0 ? totalEvents / uniqueUsersCount: 0;

    return {
      totalEvents,
      uniqueUsers: uniqueUsersCount,
      eventTypes,
      timeRange: { start: startDate, end: endDate },
      topEvents,
      userEngagement: {
        activeUsers: uniqueUsersCount,
        averageEventsPerUser
      }
    };
  }
}

// Lazy-initialized analytics service to avoid 403 errors during app startup
let analyticsServiceInstance: AnalyticsService | null = null;

export const getAnalyticsService = (): AnalyticsService => {
  if (!analyticsServiceInstance) {
    analyticsServiceInstance = new AnalyticsService();
  }
  return analyticsServiceInstance;
};

// For backward compatibility, export a function that gets the service
export const analyticsService = {
  trackEvent: (...args: Parameters<AnalyticsService['trackEvent']>) => 
    getAnalyticsService().trackEvent(...args),
  track: (...args: Parameters<AnalyticsService['track']>) => 
    getAnalyticsService().track(...args),
  trackEventImmediate: (...args: Parameters<AnalyticsService['trackEventImmediate']>) => 
    getAnalyticsService().trackEventImmediate(...args),
  getMetrics: (...args: Parameters<AnalyticsService['getMetrics']>) => 
    getAnalyticsService().getMetrics(...args),
  trackPageView: (...args: Parameters<AnalyticsService['trackPageView']>) => 
    getAnalyticsService().trackPageView(...args),
  trackUserAction: (...args: Parameters<AnalyticsService['trackUserAction']>) => 
    getAnalyticsService().trackUserAction(...args),
  trackFeatureUsage: (...args: Parameters<AnalyticsService['trackFeatureUsage']>) => 
    getAnalyticsService().trackFeatureUsage(...args),
  trackError: (...args: Parameters<AnalyticsService['trackError']>) => 
    getAnalyticsService().trackError(...args),
  trackPerformance: (...args: Parameters<AnalyticsService['trackPerformance']>) => 
    getAnalyticsService().trackPerformance(...args),
  getSessionAnalytics: (...args: Parameters<AnalyticsService['getSessionAnalytics']>) => 
    getAnalyticsService().getSessionAnalytics(...args),
  getUserAnalytics: (...args: Parameters<AnalyticsService['getUserAnalytics']>) => 
    getAnalyticsService().getUserAnalytics(...args),
  forceFlush: (...args: Parameters<AnalyticsService['forceFlush']>) => 
    getAnalyticsService().forceFlush(...args),
  getQueueStatus: (...args: Parameters<AnalyticsService['getQueueStatus']>) => 
    getAnalyticsService().getQueueStatus(...args),
}; 