/**
 * Waitlist Management Subdomain
 * Handles waitlist administration and control
 */

export * from './components';
export * from './hooks';
export * from './services';
export * from './types';

export interface WaitlistManagement {
  id: string;
  campaignId: string;
  action: 'invite' | 'remove' | 'update' | 'bulk-invite';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  data: Record<string, any>;
  executedAt: string;
  completedAt?: string;
}

export interface InviteBatch {
  id: string;
  campaignId: string;
  signupIds: string[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  sentCount: number;
  failedCount: number;
  createdAt: string;
  completedAt?: string;
}

export interface WaitlistSettings {
  id: string;
  campaignId: string;
  maxInvitesPerDay: number;
  inviteInterval: number;
  autoInvite: boolean;
  customMessage?: string;
} 