import { supabase } from '@/lib/core/supabase';
import { logger } from '@/lib/security/logger';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface Notification {
  id: string;
  user_id: string;
  type: 'info' | 'warning' | 'alert';
  message: string;
  read: boolean;
  created_at: string;
  metadata?: Record<string, any>;
}

class NotificationsService {
  async getNotifications(limit: number = 10): Promise<Notification[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return data as Notification[];
    } catch (error) {
      logger.error({ err: error }, 'Failed to fetch notifications');
      return [];
    }
  }

  async markAsRead(notificationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) {
        throw error;
      }
    } catch (error) {
      logger.error({ err: error, notificationId }, 'Failed to mark notification as read');
      throw error;
    }
  }

  async markAllAsRead(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) {
        throw error;
      }
    } catch (error) {
      logger.error({ err: error }, 'Failed to mark all notifications as read');
      throw error;
    }
  }

  async createNotification(notification: Omit<Notification, 'id' | 'created_at' | 'read'>): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert([notification]);

      if (error) {
        throw error;
      }
    } catch (error) {
      logger.error({ err: error, notification }, 'Failed to create notification');
      throw error;
    }
  }

  subscribeToNotifications(callback: (payload: any) => void): RealtimeChannel {
    const channel = supabase.channel('notifications');
    channel
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, callback)
      .subscribe();
    return channel;
  }

  unsubscribeFromNotifications(channel: RealtimeChannel) {
    supabase.removeChannel(channel);
  }
}

export const notificationsService = new NotificationsService(); 