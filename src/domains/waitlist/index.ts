/**
 * Waitlist Domain - Main Index
 * Consolidates all waitlist functionality including signups, notifications, and queue management
 */

// Waitlist Components
export { default as EmailCampaigns } from './components/EmailCampaigns';
export { default as ReferralSystem } from './components/ReferralSystem';
export { default as ShareWidget } from './components/ShareWidget';
export { default as WaitlistManager } from './components/WaitlistManager';

// Waitlist Types
export interface WaitlistEntry {
  id: string;
  email: string;
  name?: string;
  position: number;
  status: 'waiting' | 'invited' | 'joined' | 'removed';
  referralCode?: string;
  createdAt: string;
  invitedAt?: string;
}

export interface WaitlistConfig {
  id: string;
  name: string;
  description: string;
  maxCapacity: number;
  currentPosition: number;
  isActive: boolean;
  createdAt: string;
} 