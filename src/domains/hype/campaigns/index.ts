/**
 * Hype Campaigns Subdomain
 * Handles marketing campaigns and promotion
 */

export * from './components';
export * from './hooks';
export * from './services';
export * from './types';

export interface HypeCampaign {
  id: string;
  name: string;
  description: string;
  type: 'launch' | 'promotion' | 'event' | 'product';
  status: 'draft' | 'active' | 'paused' | 'completed';
  startDate: string;
  endDate?: string;
  budget: number;
  spent: number;
  metrics: CampaignMetrics;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignMetrics {
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  roi: number;
  ctr: number;
  cpc: number;
}

export interface CampaignChannel {
  id: string;
  campaignId: string;
  type: 'social' | 'email' | 'ads' | 'content';
  config: Record<string, any>;
  performance: ChannelPerformance;
}

export interface ChannelPerformance {
  reach: number;
  engagement: number;
  conversions: number;
  cost: number;
} 