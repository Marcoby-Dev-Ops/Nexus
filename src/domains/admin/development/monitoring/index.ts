/**
 * Development Monitoring Subdomain
 * Handles application monitoring and observability
 */

export * from './components';
export * from './hooks';
export * from './services';
export * from './types';

export interface MonitoringMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  timestamp: string;
  tags: Record<string, string>;
}

export interface Alert {
  id: string;
  name: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'resolved' | 'acknowledged';
  condition: AlertCondition;
  createdAt: string;
  resolvedAt?: string;
}

export interface AlertCondition {
  metric: string;
  operator: 'greater' | 'less' | 'equals' | 'contains';
  threshold: number;
  duration: number;
}

export interface PerformanceData {
  id: string;
  endpoint: string;
  responseTime: number;
  statusCode: number;
  timestamp: string;
  userId?: string;
} 