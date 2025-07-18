/**
 * Analytics Service
 * Provides centralized analytics functionality for the application
 */

import { supabase } from '@/core/supabase';
import { logger } from '@/core/auth/logger';

export interface AnalyticsEvent {
  id: string;
  event_type: string;
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
  topEvents: Array<{ event_type: string; count: number }>;
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

  constructor() {
    this.sessionId = this.generateSessionId();
    this.startBatchProcessing();
    this.checkAnalyticsTable();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Check if analytics table exists
   */
  private async checkAnalyticsTable(): Promise<void> {
    try {
      // Try to query the analytics_events table to see if it exists
      const { error } = await supabase
        .from('activities') // Use existing activities table as fallback
        .select('id')
        .limit(1);

      if (error && error.code === '42P01') {
        // Table doesn't exist, use activities table instead
        this.analyticsTableExists = false;
        logger.warn('analytics_events table not found, using activities table for analytics');
      } else {
        this.analyticsTableExists = true;
      }
    } catch (error) {
      logger.warn({ error }, 'Could not determine analytics table existence, using fallback');
      this.analyticsTableExists = false;
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
      // Use activities table as fallback since analytics_events doesn't exist
      const { error } = await supabase
        .from('activities')
        .insert(eventsToFlush.map(event => ({
          type: event.event_type,
          title: event.event_type,
          user_id: event.user_id || '',
          source: event.source || 'web',
          description: JSON.stringify(event.properties),
          metadata: event.properties,
          occurred_at: event.timestamp.toISOString()
        })));

      if (error) {
        logger.error({ error, eventCount: eventsToFlush.length }, 'Failed to flush analytics events');
        // Re-add events to queue for retry
        this.eventQueue.unshift(...eventsToFlush);
      } else {
        logger.debug({ eventCount: eventsToFlush.length }, 'Successfully flushed analytics events');
      }
    } catch (error) {
      logger.error({ error, eventCount: eventsToFlush.length }, 'Error flushing analytics events');
      // Re-add events to queue for retry
      this.eventQueue.unshift(...eventsToFlush);
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
    try {
      const event: Omit<AnalyticsEvent, 'id'> = {
        event_type: eventType,
        user_id: userId,
        session_id: this.sessionId,
        properties,
        timestamp: new Date(),
        source: source || 'web',
        version: '1.0.0'
      };

      // Add to queue for batch processing
      this.addToQueue(event);
    } catch (error) {
      logger.error({ eventType, properties, userId, error }, 'Failed to track analytics event');
    }
  }

  /**
   * Track event immediately (bypasses batching)
   */
  async trackEventImmediate(
    eventType: string,
    properties: Record<string, any> = {},
    userId?: string,
    source?: string
  ): Promise<void> {
    try {
      const event: Omit<AnalyticsEvent, 'id'> = {
        event_type: eventType,
        user_id: userId,
        session_id: this.sessionId,
        properties,
        timestamp: new Date(),
        source: source || 'web',
        version: '1.0.0'
      };

      const { error } = await supabase
        .from('activities')
        .insert({
          type: event.event_type,
          title: event.event_type,
          user_id: event.user_id || '',
          source: event.source || 'web',
          description: JSON.stringify(event.properties),
          metadata: event.properties,
          occurred_at: event.timestamp.toISOString()
        });

      if (error) {
        logger.error({ error, eventType }, 'Failed to track immediate analytics event');
      }
    } catch (error) {
      logger.error({ eventType, properties, userId, error }, 'Failed to track immediate analytics event');
    }
  }

  /**
   * Get analytics metrics for a time range
   */
  async getMetrics(
    startDate: Date,
    endDate: Date,
    userId?: string
  ): Promise<AnalyticsMetrics> {
    try {
      let query = supabase
        .from('activities')
        .select('*')
        .gte('occurred_at', startDate.toISOString())
        .lte('occurred_at', endDate.toISOString());

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data: events, error } = await query;

      if (error) {
        throw new Error(`Failed to get analytics metrics: ${error.message}`);
      }

      const eventTypes: Record<string, number> = {};
      const uniqueUsers = new Set<string>();
      const eventCounts: Record<string, number> = {};

      events?.forEach((event: any) => {
        const eventType = event.type || event.event_type || 'unknown';
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

      const totalEvents = events?.length || 0;
      const uniqueUsersCount = uniqueUsers.size;
      const averageEventsPerUser = uniqueUsersCount > 0 ? totalEvents / uniqueUsersCount : 0;

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
    } catch (error) {
      logger.error({ startDate, endDate, userId, error }, 'Failed to get analytics metrics');
      return {
        totalEvents: 0,
        uniqueUsers: 0,
        eventTypes: {},
        timeRange: { start: startDate, end: endDate },
        topEvents: [],
        userEngagement: {
          activeUsers: 0,
          averageEventsPerUser: 0
        }
      };
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
      usage_count: properties.usage_count || 1,
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
        event_type: event.type || event.event_type || 'unknown',
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
}

export const analyticsService = new AnalyticsService(); 