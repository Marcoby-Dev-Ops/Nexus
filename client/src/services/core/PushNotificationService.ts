import { logger } from '@/shared/utils/logger';

export interface PushSubscription {
  id: string;
  userId: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PushNotificationData {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  data?: Record<string, any>;
  url?: string;
}

class PushNotificationService {
  private registration: ServiceWorkerRegistration | null = null;
  private subscription: PushSubscription | null = null;

  constructor() {
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
      this.init();
    } else {
      logger.info('PushNotificationService initialized in non-browser environment');
    }
  }

  private async init() {
    try {
      if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
        await this.registerServiceWorker();
      } else {
        logger.warn('Push notifications not supported in this browser');
      }
    } catch (error) {
      logger.error('Failed to initialize push notifications:', error);
    }
  }

  private async registerServiceWorker(): Promise<void> {
    try {
      this.registration = await navigator.serviceWorker.register('/sw.js');
      logger.info('Service Worker registered successfully');
      
      // Handle service worker updates
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration!.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker available
              logger.info('New service worker available');
            }
          });
        }
      });
    } catch (error) {
      logger.error('Failed to register service worker:', error);
      throw error;
    }
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      throw new Error('Notifications not supported');
    }

    const permission = await Notification.requestPermission();
    logger.info('Notification permission:', permission);
    return permission;
  }

  async getPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }
    return Notification.permission;
  }

  async subscribeToPush(userId: string): Promise<PushSubscription | null> {
    try {
      if (!this.registration) {
        throw new Error('Service Worker not registered');
      }

      const permission = await this.getPermission();
      if (permission !== 'granted') {
        const newPermission = await this.requestPermission();
        if (newPermission !== 'granted') {
          throw new Error('Notification permission denied');
        }
      }

      // Get existing subscription or create new one
      let subscription = await this.registration.pushManager.getSubscription();
      
      if (!subscription) {
        // Get VAPID public key from server
        const response = await fetch('/api/push/vapid-public-key');
        if (!response.ok) {
          throw new Error('Failed to get VAPID public key');
        }
        
        const { publicKey } = await response.json();
        
        // Convert base64 to Uint8Array
        const vapidPublicKey = this.urlBase64ToUint8Array(publicKey);
        
        // Subscribe to push notifications
        subscription = await this.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: vapidPublicKey
        });
      }

      // Save subscription to server
      const subscriptionData = {
        userId,
        endpoint: subscription.endpoint,
        keys: {
          p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')!),
          auth: this.arrayBufferToBase64(subscription.getKey('auth')!)
        }
      };

      const saveResponse = await fetch('/api/push/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscriptionData)
      });

      if (!saveResponse.ok) {
        throw new Error('Failed to save push subscription');
      }

      const savedSubscription = await saveResponse.json();
      if (!savedSubscription.success) {
        throw new Error(savedSubscription.error || 'Failed to save push subscription');
      }
      this.subscription = savedSubscription.data;
      
      logger.info('Successfully subscribed to push notifications');
      return this.subscription;
    } catch (error) {
      logger.error('Failed to subscribe to push notifications:', error);
      throw error;
    }
  }

  async unsubscribeFromPush(): Promise<void> {
    try {
      if (!this.registration) {
        throw new Error('Service Worker not registered');
      }

      const subscription = await this.registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        
        // Remove subscription from server
        const response = await fetch('/api/push/subscriptions', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            endpoint: subscription.endpoint
          })
        });

        if (!response.ok) {
          throw new Error('Failed to remove push subscription');
        }

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error || 'Failed to remove push subscription');
        }
      }

      this.subscription = null;
      logger.info('Successfully unsubscribed from push notifications');
    } catch (error) {
      logger.error('Failed to unsubscribe from push notifications:', error);
      throw error;
    }
  }

  async getSubscription(): Promise<PushSubscription | null> {
    if (!this.registration) {
      return null;
    }

    const subscription = await this.registration.pushManager.getSubscription();
    if (!subscription) {
      return null;
    }

    // Get subscription data from server
    try {
      const response = await fetch(`/api/push/subscriptions?endpoint=${encodeURIComponent(subscription.endpoint)}`);
      if (response.ok) {
        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error || 'Failed to load subscription');
        }
        return result.data;
      }
    } catch (error) {
      logger.error('Failed to get subscription data:', error);
    }

    return null;
  }

  async isSubscribed(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }

    const subscription = await this.registration.pushManager.getSubscription();
    return subscription !== null;
  }

  // Utility methods for converting between formats
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  // Test method to send a notification
  async sendTestNotification(): Promise<void> {
    try {
      const response = await fetch('/api/push/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Test Notification',
          body: 'This is a test push notification from Nexus!',
          url: '/dashboard'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send test notification');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to send test notification');
      }

      logger.info(result.message || 'Test notification request accepted');
    } catch (error) {
      logger.error('Failed to send test notification:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const pushNotificationService = new PushNotificationService();
