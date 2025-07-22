/**
 * Waitlist Signups Subdomain
 * Handles waitlist registration and management
 */

export * from './components';
export * from './hooks';
export * from './services';
export * from './types';

export interface WaitlistSignup {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  source: string;
  status: 'waiting' | 'invited' | 'registered' | 'declined';
  position: number;
  joinedAt: string;
  invitedAt?: string;
  registeredAt?: string;
  metadata: Record<string, any>;
}

export interface WaitlistCampaign {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'paused' | 'closed';
  maxSignups?: number;
  currentSignups: number;
  createdAt: string;
  updatedAt: string;
}

export interface SignupSource {
  id: string;
  name: string;
  url?: string;
  signupCount: number;
  conversionRate: number;
} 