/**
 * Waitlist Notifications Subdomain
 * Handles notification management and delivery
 */

export * from './components';
export * from './hooks';
export * from './services';
export * from './types';

export interface WaitlistNotification {
  id: string;
  signupId: string;
  type: 'welcome' | 'position-update' | 'invitation' | 'reminder';
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  channel: 'email' | 'sms' | 'push';
  content: NotificationContent;
  sentAt?: string;
  deliveredAt?: string;
}

export interface NotificationContent {
  subject: string;
  body: string;
  template: string;
  variables: Record<string, any>;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  type: string;
  subject: string;
  body: string;
  variables: string[];
  status: 'active' | 'inactive';
} 