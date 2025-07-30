import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth.ts';
import { insertOne } from '@/lib/supabase';
import { logger } from '@/shared/utils/logger.ts';

interface WidgetEvent {
  widget_id: string;
  event_type: 'view' | 'interaction' | 'error';
  user_id?: string;
  session_id?: string;
  metadata?: Record<string, any>;
}

export const useWidgetAnalytics = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trackEvent = async (event: WidgetEvent) => {
    if (!user?.id) {
      logger.warn('Cannot track widget event: No authenticated user');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const eventData = {
        ...event,
        user_id: user.id,
        timestamp: new Date().toISOString(),
        session_id: sessionStorage.getItem('session_id') || undefined
      };

      await insertOne('WidgetEvent', eventData);
    } catch (error) {
      logger.error('Error in trackEvent:', error);
      setError('Failed to track widget event');
    } finally {
      setIsLoading(false);
    }
  };

  const trackView = async (widgetId: string, metadata?: Record<string, any>) => {
    await trackEvent({
      widget_id: widgetId,
      event_type: 'view',
      metadata
    });
  };

  const trackInteraction = async (widgetId: string, metadata?: Record<string, any>) => {
    await trackEvent({
      widget_id: widgetId,
      event_type: 'interaction',
      metadata
    });
  };

  const trackError = async (widgetId: string, error: string, metadata?: Record<string, any>) => {
    await trackEvent({
      widget_id: widgetId,
      event_type: 'error',
      metadata: {
        ...metadata,
        error_message: error
      }
    });
  };

  return {
    trackEvent,
    trackView,
    trackInteraction,
    trackError,
    isLoading,
    error
  };
}; 