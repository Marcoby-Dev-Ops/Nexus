import { useState } from 'react';
import { useAuth } from '@/core/auth/AuthProvider';
import { supabase } from '@/core/supabase';
import { DatabaseQueryWrapper } from '@/core/database/queryWrapper';
import { logger } from '@/shared/utils/logger';

interface WidgetEvent {
  widget_id: string;
  event_type: 'view' | 'interaction' | 'error';
  user_id?: string;
  session_id?: string;
  metadata?: Record<string, any>;
}

export const useWidgetAnalytics = () => {
  const { user } = useAuth();
  const queryWrapper = new DatabaseQueryWrapper();
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

      const { error } = await queryWrapper.userQuery(
        async () => supabase.from('WidgetEvent').insert([eventData]),
        user.id,
        'track-widget-event'
      );

      if (error) {
        logger.error('Error tracking widget event:', error);
        setError('Failed to track widget event');
      }
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