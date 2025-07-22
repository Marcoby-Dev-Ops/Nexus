/**
 * Hype Domain - Main Index
 * Consolidates all hype and marketing functionality including campaigns, viral features, and growth tools
 */

// Hype Components
export { default as HypeBuilder } from './components/HypeBuilder';

// Hype Types
export interface HypeCampaign {
  id: string;
  name: string;
  description: string;
  type: 'viral' | 'referral' | 'social' | 'influencer';
  status: 'active' | 'paused' | 'completed';
  metrics: {
    impressions: number;
    clicks: number;
    conversions: number;
    viralityScore: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ViralFeature {
  id: string;
  name: string;
  description: string;
  category: 'sharing' | 'gamification' | 'social' | 'exclusivity';
  enabled: boolean;
  config: Record<string, any>;
} 