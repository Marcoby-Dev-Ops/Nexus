import { useState, useCallback } from 'react';
import { selectData as select, selectOne, updateOne } from '@/lib/api-client';
import { logger } from '@/shared/utils/logger';

interface NotificationSettings {
  id: string;
  user_id: string;
  email_notifications: boolean;
  push_notifications: boolean;
  sms_notifications: boolean;
  notification_types: string[];
  created_at: string;
  updated_at: string;
}

export const useNotificationSettings = () => {
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await selectOne('notification_settings', userId, 'user_id');
      if (error) {
        logger.error({ error }, 'Failed to fetch notification settings');
        setError('Failed to fetch settings');
        return;
      }
      setSettings(data);
    } catch (err) {
      logger.error({ err }, 'Error fetching notification settings');
      setError('Error fetching settings');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSettings = useCallback(async (userId: string, updates: Partial<NotificationSettings>) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await updateOne('notification_settings', userId, updates, 'user_id');
      if (error) {
        logger.error({ error }, 'Failed to update notification settings');
        setError('Failed to update settings');
        return null;
      }
      setSettings(prev => prev ? { ...prev, ...updates } : null);
      return data;
    } catch (err) {
      logger.error({ err }, 'Error updating notification settings');
      setError('Error updating settings');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    settings,
    loading,
    error,
    fetchSettings,
    updateSettings,
  };
}; 
