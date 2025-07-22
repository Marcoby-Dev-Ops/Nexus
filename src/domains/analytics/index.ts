/**
 * Analytics Domain - Main Index
 * Consolidates all analytics functionality including reports, dashboards, insights, and exports
 */

// Analytics Subdomains - Commented out until proper exports are available
// export * from './reports';
// export * from './dashboards';
// export * from './insights';
// export * from './export';

// Analytics Pages
export { default as FireCyclePage } from './pages/FireCyclePage';
export { default as DataWarehouseHome } from './pages/DataWarehouseHome';
export { default as UnifiedAnalyticsPage } from './pages/UnifiedAnalyticsPage';
export { default as IntegrationsPage } from './pages/IntegrationsPage';
export { default as IntegrationTrackingPage } from './pages/IntegrationTrackingPage';
export { default as GoogleAnalyticsCallback } from './pages/GoogleAnalyticsCallback';
export { default as IntegrationsShowcase } from './pages/IntegrationsShowcase';

// FIRE CYCLE Components
export { FireCycleDashboard } from './components/FireCycleDashboard';
export { NorthStarCard } from './components/NorthStarCard';
export { KeyMetricsCard } from './components/KeyMetricsCard';
export { PrioritiesCard } from './components/PrioritiesCard';
export { BlockersCard } from './components/BlockersCard';
export { OpportunitiesCard } from './components/OpportunitiesCard';
export { RisksCard } from './components/RisksCard';
export { TrendsCard } from './components/TrendsCard';

// Analytics Components
export { default as CrossPlatformInsightsEngine } from './components/CrossPlatformInsightsEngine';
export { default as DigestibleMetricsDashboard } from './components/DigestibleMetricsDashboard';
export { default as UnifiedAnalyticsDashboard } from './components/UnifiedAnalyticsDashboard';

// Analytics Services
export { analyticsService } from './services/analyticsService';
export { communicationAnalyticsService } from './services/communicationAnalyticsService';

// Analytics Types
export interface AnalyticsConfig {
  enableRealTime: boolean;
  enablePredictions: boolean;
  enableInsights: boolean;
  dataRetentionDays: number;
} 