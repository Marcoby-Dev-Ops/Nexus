/**
 * Communication Analytics Service
 * Provides analytics for communication patterns and team collaboration
 */

import { supabase } from '@/core/supabase';
import { logger } from '@/core/auth/logger';

export interface CommunicationMetrics {
  totalMessages: number;
  activeConversations: number;
  responseTime: number; // Average response time in minutes
  teamCollaboration: {
    crossDepartmental: number;
    internal: number;
    external: number;
  };
  channels: {
    email: number;
    chat: number;
    video: number;
    voice: number;
  };
}

export interface CommunicationEvent {
  id: string;
  event_type: string;
  user_id?: string;
  session_id?: string;
  properties: Record<string, any>;
  timestamp: Date;
  source?: string;
  version?: string;
}

class CommunicationAnalyticsService {
  /**
   * Get communication metrics for a time period
   */
  async getCommunicationMetrics(
    startDate: Date,
    endDate: Date,
    userId?: string
  ): Promise<CommunicationMetrics> {
    try {
      let query = supabase
        .from('communication_events')
        .select('*')
        .gte('timestamp', startDate.toISOString())
        .lte('timestamp', endDate.toISOString());

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data: events, error } = await query;

      if (error) {
        logger.error({ startDate, endDate, userId, error }, 'Failed to get communication metrics');
        return this.getDefaultMetrics();
      }

      // Calculate metrics from events
      const totalMessages = events?.length || 0;
      const activeConversations = this.calculateActiveConversations(events);
      const responseTime = this.calculateAverageResponseTime(events);
      const teamCollaboration = this.calculateTeamCollaboration(events);
      const channels = this.calculateChannelDistribution(events);

      return {
        totalMessages,
        activeConversations,
        responseTime,
        teamCollaboration,
        channels
      };
    } catch (error) {
      logger.error({ startDate, endDate, userId, error }, 'Failed to get communication metrics');
      return this.getDefaultMetrics();
    }
  }

  /**
   * Track communication event
   */
  async trackCommunicationEvent(
    eventType: string,
    properties: Record<string, any> = {},
    userId?: string,
    _sessionId?: string
  ): Promise<void> {
    try {
      const event = {
        event_type: eventType,
        user_id: userId || '',
        platform: 'web',
        event_data: properties,
        timestamp: new Date().toISOString()
      };

      const { error } = await supabase
        .from('communication_events')
        .insert(event);

      if (error) {
        logger.error({ error, eventType }, 'Failed to track communication event');
      } else {
        logger.debug({ eventType, userId }, 'Successfully tracked communication event');
      }
    } catch (error) {
      logger.error({ eventType, properties, userId, error }, 'Failed to track communication event');
    }
  }

  /**
   * Track message sent
   */
  async trackMessageSent(
    channel: string,
    recipientType: 'internal' | 'external' | 'cross_departmental',
    properties: Record<string, any> = {},
    userId?: string
  ): Promise<void> {
    await this.trackCommunicationEvent('message_sent', {
      channel,
      recipient_type: recipientType,
      ...properties
    }, userId);
  }

  /**
   * Track response time
   */
  async trackResponseTime(
    responseTimeMs: number,
    channel: string,
    properties: Record<string, any> = {},
    userId?: string
  ): Promise<void> {
    await this.trackCommunicationEvent('response_time', {
      response_time_ms: responseTimeMs,
      channel,
      ...properties
    }, userId);
  }

  /**
   * Track meeting/communication session
   */
  async trackCommunicationSession(
    sessionType: 'meeting' | 'call' | 'chat' | 'email',
    duration: number,
    participants: number,
    properties: Record<string, any> = {},
    userId?: string
  ): Promise<void> {
    await this.trackCommunicationEvent('communication_session', {
      session_type: sessionType,
      duration_minutes: duration,
      participant_count: participants,
      ...properties
    }, userId);
  }

  /**
   * Calculate active conversations from events
   */
  private calculateActiveConversations(events: any[]): number {
    if (!events || events.length === 0) return 0;

    const conversationIds = new Set<string>();
    events.forEach(event => {
      const conversationId = event.properties?.conversation_id || event.properties?.session_id;
      if (conversationId) {
        conversationIds.add(conversationId);
      }
    });

    return conversationIds.size;
  }

  /**
   * Calculate average response time
   */
  private calculateAverageResponseTime(events: any[]): number {
    if (!events || events.length === 0) return 0;

    const responseTimeEvents = events.filter(event => 
      event.event_type === 'response_time' && event.properties?.response_time_ms
    );

    if (responseTimeEvents.length === 0) return 0;

    const totalResponseTime = responseTimeEvents.reduce((sum, event) => 
      sum + (event.properties.response_time_ms || 0), 0
    );

    return Math.round(totalResponseTime / responseTimeEvents.length / 60000); // Convert to minutes
  }

  /**
   * Calculate team collaboration metrics
   */
  private calculateTeamCollaboration(events: any[]): {
    crossDepartmental: number;
    internal: number;
    external: number;
  } {
    if (!events || events.length === 0) {
      return { crossDepartmental: 0, internal: 0, external: 0 };
    }

    const collaboration = {
      crossDepartmental: 0,
      internal: 0,
      external: 0
    };

    events.forEach(event => {
      const recipientType = event.properties?.recipient_type;
      if (recipientType === 'cross_departmental') {
        collaboration.crossDepartmental++;
      } else if (recipientType === 'internal') {
        collaboration.internal++;
      } else if (recipientType === 'external') {
        collaboration.external++;
      }
    });

    return collaboration;
  }

  /**
   * Calculate channel distribution
   */
  private calculateChannelDistribution(events: any[]): {
    email: number;
    chat: number;
    video: number;
    voice: number;
  } {
    if (!events || events.length === 0) {
      return { email: 0, chat: 0, video: 0, voice: 0 };
    }

    const channels = {
      email: 0,
      chat: 0,
      video: 0,
      voice: 0
    };

    events.forEach(event => {
      const channel = event.properties?.channel?.toLowerCase();
      if (channel === 'email') {
        channels.email++;
      } else if (channel === 'chat' || channel === 'messaging') {
        channels.chat++;
      } else if (channel === 'video' || channel === 'video_call') {
        channels.video++;
      } else if (channel === 'voice' || channel === 'phone') {
        channels.voice++;
      }
    });

    return channels;
  }

  /**
   * Get default metrics when data is unavailable
   */
  private getDefaultMetrics(): CommunicationMetrics {
    return {
      totalMessages: 0,
      activeConversations: 0,
      responseTime: 0,
      teamCollaboration: {
        crossDepartmental: 0,
        internal: 0,
        external: 0
      },
      channels: {
        email: 0,
        chat: 0,
        video: 0,
        voice: 0
      }
    };
  }
}

export const communicationAnalyticsService = new CommunicationAnalyticsService(); 