/**
 * Help Center Support Subdomain
 * Handles support interactions and live chat
 */

export * from './components';
export * from './hooks';
export * from './services';
export * from './types';

export interface SupportSession {
  id: string;
  userId: string;
  agentId?: string;
  status: 'waiting' | 'active' | 'ended';
  startedAt: string;
  endedAt?: string;
  messages: SupportMessage[];
  rating?: number;
  feedback?: string;
}

export interface SupportMessage {
  id: string;
  sessionId: string;
  senderId: string;
  senderType: 'user' | 'agent' | 'system';
  content: string;
  timestamp: string;
  attachments?: SupportAttachment[];
}

export interface SupportAttachment {
  id: string;
  name: string;
  type: string;
  url: string;
  size: number;
}

export interface SupportAgent {
  id: string;
  name: string;
  email: string;
  status: 'online' | 'offline' | 'busy';
  specialties: string[];
  currentSessions: number;
} 