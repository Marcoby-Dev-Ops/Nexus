/**
 * Development Deployments Subdomain
 * Handles deployment management and automation
 */

export * from './components';
export * from './hooks';
export * from './services';
export * from './types';

export interface Deployment {
  id: string;
  version: string;
  environment: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'rolledback';
  startTime: string;
  endTime?: string;
  duration?: number;
  logs: DeploymentLog[];
  artifacts: DeploymentArtifact[];
}

export interface DeploymentLog {
  id: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  message: string;
  timestamp: string;
  source: string;
}

export interface DeploymentArtifact {
  id: string;
  name: string;
  type: 'build' | 'config' | 'asset';
  url: string;
  size: number;
  checksum: string;
} 