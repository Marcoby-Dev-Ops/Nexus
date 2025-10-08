import { z } from 'zod';
import { BaseService } from '@/core/services/BaseService';
import type { ServiceResponse } from '@/core/services/BaseService';
import type { CrudServiceInterface, ServiceConfig } from '@/core/services/interfaces';
import { selectData as select, selectOne, insertOne, updateOne, deleteOne, callEdgeFunction } from '@/lib/database';
import { logger } from '@/shared/utils/logger';

// Notification Schemas
export const NotificationSchema = z.object({
  id: z.string().optional(),
  user_id: z.string(),
  company_id: z.string().optional(),
  type: z.enum(['info', 'success', 'warning', 'error', 'system']),
  title: z.string(),
  message: z.string(),
  category: z.string().optional(), // billing, security, integration, etc.
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  read: z.boolean().default(false),
  action_url: z.string().optional(),
  action_text: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  expires_at: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export const NotificationTemplateSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  type: z.string(),
  title_template: z.string(),
  message_template: z.string(),
  variables: z.array(z.string()).optional(),
  category: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export const NotificationChannelSchema = z.object({
  id: z.string().optional(),
  user_id: z.string(),
  channel: z.enum(['email', 'push', 'sms', 'in_app', 'slack', 'teams']),
  enabled: z.boolean().default(true),
  settings: z.record(z.any()).optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type Notification = z.infer<typeof NotificationSchema>;
export type NotificationTemplate = z.infer<typeof NotificationTemplateSchema>;
export type NotificationChannel = z.infer<typeof NotificationChannelSchema>;

// Service Configuration
const notificationServiceConfig: ServiceConfig = {
  tableName: 'notifications',
  schema: NotificationSchema,
  cacheEnabled: true,
  cacheTTL: 60, // 1 minute
  enableLogging: true,
};

/**
 * NotificationService - Handles real-time notifications and messaging
 * 
 * Features:
 * - Real-time notifications
 * - Notification templates
 * - Multi-channel delivery (email, push, SMS, in-app)
 * - Priority-based delivery
 * - Read/unread tracking
 * - Notification preferences
 * - Bulk notifications
 * - Scheduled notifications
 */
export class NotificationService extends BaseService implements CrudServiceInterface<Notification> {
  protected config = notificationServiceConfig;

  constructor() {
    super();
  }

  // ====================================================================
  // CRUD OPERATIONS
  // ====================================================================

  async get(id: string): Promise<ServiceResponse<Notification>> {
    this.logMethodCall('get', { id });
    return this.executeDbOperation(async () => {
      const { data, error } = await supabase
        .from(this.config.tableName)
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      const validatedData = this.config.schema.parse(data);
      return { data: validatedData, error: null };
    }, `get ${this.config.tableName} ${id}`);
  }

  async create(data: Partial<Notification>): Promise<ServiceResponse<Notification>> {
    this.logMethodCall('create', { data });
    return this.executeDbOperation(async () => {
      const { data: result, error } = await supabase
        .from(this.config.tableName)
        .insert({
          ...data,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      if (error) throw error;
      const validatedData = this.config.schema.parse(result);
      return { data: validatedData, error: null };
    }, `create ${this.config.tableName}`);
  }

  async update(id: string, data: Partial<Notification>): Promise<ServiceResponse<Notification>> {
    this.logMethodCall('update', { id, data });
    return this.executeDbOperation(async () => {
      const { data: result, error } = await supabase
        .from(this.config.tableName)
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      const validatedData = this.config.schema.parse(result);
      return { data: validatedData, error: null };
    }, `update ${this.config.tableName} ${id}`);
  }

  async delete(id: string): Promise<ServiceResponse<boolean>> {
    this.logMethodCall('delete', { id });
    return this.executeDbOperation(async () => {
      const { error } = await supabase
        .from(this.config.tableName)
        .delete()
        .eq('id', id);
      if (error) throw error;
      return { data: true, error: null };
    }, `delete ${this.config.tableName} ${id}`);
  }

  async list(filters?: Record<string, any>): Promise<ServiceResponse<Notification[]>> {
    this.logMethodCall('list', { filters });
    return this.executeDbOperation(async () => {
      let query = supabase
        .from(this.config.tableName)
        .select('*');
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        });
      }
      const { data, error } = await query;
      if (error) throw error;
      const validatedData = data.map(item => this.config.schema.parse(item));
      return { data: validatedData, error: null };
    }, `list ${this.config.tableName}`);
  }

  // ====================================================================
  // NOTIFICATION OPERATIONS
  // ====================================================================

  // Send individual notification
  async sendNotification(userId: string, notification: Partial<Notification>) {
    this.logMethodCall('sendNotification', { userId, notification });
    
    try {
      const newNotification = {
        user_id: userId,
        type: notification.type || 'info',
        title: notification.title || '',
        message: notification.message || '',
        category: notification.category,
        priority: notification.priority || 'medium',
        read: false,
        action_url: notification.action_url,
        action_text: notification.action_text,
        metadata: notification.metadata,
        expires_at: notification.expires_at,
        created_at: new Date().toISOString(),
      };

      const result = await this.create(newNotification);
      
      if (result.success && result.data) {
        // Trigger real-time delivery
        await this.deliverNotification(result.data);
      }

      return result;
    } catch (error) {
      return this.handleError('sendNotification', error);
    }
  }

  // Send bulk notifications
  async sendBulkNotification(userIds: string[], notification: Partial<Notification>) {
    this.logMethodCall('sendBulkNotification', { userIds, notification });
    
    try {
      const notifications = userIds.map(userId => ({
        user_id: userId,
        type: notification.type || 'info',
        title: notification.title || '',
        message: notification.message || '',
        category: notification.category,
        priority: notification.priority || 'medium',
        read: false,
        action_url: notification.action_url,
        action_text: notification.action_text,
        metadata: notification.metadata,
        expires_at: notification.expires_at,
        created_at: new Date().toISOString(),
      }));

      const results = await Promise.all(
        notifications.map(notif => this.create(notif))
      );

      // Trigger real-time delivery for all
      await Promise.all(
        results
          .filter(result => result.success && result.data)
          .map(result => this.deliverNotification(result.data!))
      );

      return {
        data: results,
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError('sendBulkNotification', error);
    }
  }

  // Mark notification as read
  async markAsRead(notificationId: string) {
    this.logMethodCall('markAsRead', { notificationId });
    
    try {
      return await this.update(notificationId, {
        read: true,
        updated_at: new Date().toISOString(),
      });
    } catch (error) {
      return this.handleError('markAsRead', error);
    }
  }

  // Mark all notifications as read for a user
  async markAllAsRead(userId: string) {
    this.logMethodCall('markAllAsRead', { userId });
    
    try {
      const notifications = await this.list({ user_id: userId, read: false });
      
      if (notifications.success && notifications.data) {
        const updatePromises = notifications.data.map(notification =>
          this.update(notification.id!, {
            read: true,
            updated_at: new Date().toISOString(),
          })
        );

        await Promise.all(updatePromises);
      }

      return {
        data: { message: 'All notifications marked as read' },
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError('markAllAsRead', error);
    }
  }

  // Get unread count for a user
  async getUnreadCount(userId: string) {
    this.logMethodCall('getUnreadCount', { userId });
    
    try {
      const notifications = await this.list({ user_id: userId, read: false });
      
      return {
        data: { count: notifications.data?.length || 0 },
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError('getUnreadCount', error);
    }
  }

  // Get notifications by category
  async getNotificationsByCategory(userId: string, category: string) {
    return this.list({ user_id: userId, category });
  }

  // Get notifications by priority
  async getNotificationsByPriority(userId: string, priority: string) {
    return this.list({ user_id: userId, priority });
  }

  // Subscribe to notification channel
  async subscribeToChannel(userId: string, channel: string, settings?: any) {
    this.logMethodCall('subscribeToChannel', { userId, channel, settings });
    
    try {
      // This would typically interact with a notification_channels table
      const channelSubscription = {
        user_id: userId,
        channel,
        enabled: true,
        settings: settings || {},
        created_at: new Date().toISOString(),
      };

      // Mock implementation - in real app, this would save to notification_channels table
      return {
        data: channelSubscription,
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError('subscribeToChannel', error);
    }
  }

  // Unsubscribe from notification channel
  async unsubscribeFromChannel(userId: string, channel: string) {
    this.logMethodCall('unsubscribeFromChannel', { userId, channel });
    
    try {
      // Mock implementation - in real app, this would update notification_channels table
      return {
        data: { message: `Unsubscribed from ${channel}` },
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError('unsubscribeFromChannel', error);
    }
  }

  // Send system notification
  async sendSystemNotification(message: string, category?: string) {
    this.logMethodCall('sendSystemNotification', { message, category });
    
    try {
      const systemNotification = {
        user_id: 'system',
        type: 'system' as const,
        title: 'System Notification',
        message,
        category: category || 'system',
        priority: 'medium' as const,
        read: false,
        created_at: new Date().toISOString(),
      };

      return await this.create(systemNotification);
    } catch (error) {
      return this.handleError('sendSystemNotification', error);
    }
  }

  // Send urgent notification
  async sendUrgentNotification(userId: string, title: string, message: string) {
    return this.sendNotification(userId, {
      type: 'error',
      title,
      message,
      priority: 'urgent',
      category: 'urgent',
    });
  }

  // Send billing notification
  async sendBillingNotification(userId: string, title: string, message: string) {
    return this.sendNotification(userId, {
      type: 'warning',
      title,
      message,
      category: 'billing',
      priority: 'high',
    });
  }

  // Send security notification
  async sendSecurityNotification(userId: string, title: string, message: string) {
    return this.sendNotification(userId, {
      type: 'warning',
      title,
      message,
      category: 'security',
      priority: 'high',
    });
  }

  // Send integration notification
  async sendIntegrationNotification(userId: string, title: string, message: string) {
    return this.sendNotification(userId, {
      type: 'info',
      title,
      message,
      category: 'integration',
      priority: 'medium',
    });
  }

  // Get notification statistics
  async getNotificationStats(userId: string) {
    this.logMethodCall('getNotificationStats', { userId });
    
    try {
      const allNotifications = await this.list({ user_id: userId });
      
      if (!allNotifications.success || !allNotifications.data) {
        return {
          data: { total: 0, unread: 0, byType: {}, byCategory: {} },
          error: null,
          success: true,
        };
      }

      const notifications = allNotifications.data;
      const stats = {
        total: notifications.length,
        unread: notifications.filter(n => !n.read).length,
        byType: notifications.reduce((acc, n) => {
          acc[n.type] = (acc[n.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        byCategory: notifications.reduce((acc, n) => {
          if (n.category) {
            acc[n.category] = (acc[n.category] || 0) + 1;
          }
          return acc;
        }, {} as Record<string, number>),
      };

      return {
        data: stats,
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError('getNotificationStats', error);
    }
  }

  // Delete expired notifications
  async deleteExpiredNotifications() {
    this.logMethodCall('deleteExpiredNotifications');
    
    try {
      const now = new Date().toISOString();
      const notifications = await this.list({});
      
      if (!notifications.success || !notifications.data) {
        return {
          data: { deleted: 0 },
          error: null,
          success: true,
        };
      }

      const expiredNotifications = notifications.data.filter(
        notification => notification.expires_at && notification.expires_at < now
      );

      const deletePromises = expiredNotifications.map(notification =>
        this.delete(notification.id!)
      );

      await Promise.all(deletePromises);

      return {
        data: { deleted: expiredNotifications.length },
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError('deleteExpiredNotifications', error);
    }
  }

  // ====================================================================
  // PRIVATE HELPER METHODS
  // ====================================================================

  // Private helper method for notification delivery
  private async deliverNotification(notification: Notification) {
    // Mock implementation - in real app, this would:
    // 1. Check user's notification preferences
    // 2. Send via appropriate channels (email, push, SMS, etc.)
    // 3. Handle delivery failures and retries
    
    console.log(`Delivering notification: ${notification.title} to user ${notification.user_id}`);
    
    // Simulate delivery delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return {
      success: true,
      data: { delivered: true, channels: ['in_app'] },
      error: null,
    };
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
