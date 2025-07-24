/**
 * Workspace Inbox Subdomain
 * Handles email, communication, and message management
 */

// Inbox Components
export * from './components';

// Inbox Hooks
export * from './hooks';

// Inbox Services
export * from './services';

// Inbox Types
export * from './types';

// Inbox Types
export interface InboxMessage {
  id: string;
  subject: string;
  sender: string;
  recipient: string;
  content: string;
  timestamp: string;
  read: boolean;
  priority: 'high' | 'medium' | 'low';
  category: 'work' | 'personal' | 'system' | 'notification';
}

export interface InboxFilter {
  read?: boolean;
  priority?: string[];
  category?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface InboxConfig {
  autoArchive: boolean;
  notifications: boolean;
  threading: boolean;
  smartSort: boolean;
} 