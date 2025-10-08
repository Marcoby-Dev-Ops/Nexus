import { useState, useCallback } from 'react';
import { selectData, insertOne } from '@/lib/api-client';
import { logger } from '@/shared/utils/logger';

interface AnalyticsEvent {
  id: string;
  user_id: string;
  event_type: string;
  event_data: any;
  timestamp: string;
  created_at: string;
}

export const useAnalytics = () => {
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await selectData('analytics_events', '*', { user_id: userId });
      if (error) {
        logger.error({ error }, 'Failed to fetch analytics events');
        setError('Failed to fetch events');
        return;
      }
      setEvents(data || []);
    } catch (err) {
      logger.error({ err }, 'Error fetching analytics events');
      setError('Error fetching events');
    } finally {
      setLoading(false);
    }
  }, []);

  const trackEvent = useCallback(async (userId: string, eventType: string, eventData: any) => {
    try {
      const { data, error } = await insertOne('analytics_events', {
        user_id: userId,
        event_type: eventType,
        event_data: eventData,
        timestamp: new Date().toISOString(),
      });
      if (error) {
        logger.error({ error }, 'Failed to track analytics event');
        return null;
      }
      setEvents(prev => [...prev, data]);
      return data;
    } catch (err) {
      logger.error({ err }, 'Error tracking analytics event');
      return null;
    }
  }, []);

  return {
    events,
    loading,
    error,
    fetchEvents,
    trackEvent,
  };
}; 
