/**
 * Integration Health Monitoring Service
 * 
 * Monitors integration health, tracks errors, and provides reliability metrics
 */

import { BaseService } from '@/core/services/BaseService';
import { logger } from '@/shared/utils/logger';
import { retry } from '@/shared/utils/retry';

export interface IntegrationHealthMetrics {
  integrationId: string;
  status: 'healthy' | 'degraded' | 'failed' | 'unknown';
  uptime: number; // percentage
  responseTime: number; // average in ms
  errorRate: number; // percentage
  lastSuccessfulCall?: string;
  lastError?: string;
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  consecutiveFailures: number;
}

export interface HealthCheckResult {
  success: boolean;
  responseTime: number;
  error?: string;
  timestamp: string;
}

export class IntegrationHealthService extends BaseService {
  private healthMetrics: Map<string, IntegrationHealthMetrics> = new Map();
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.startMonitoring();
  }

  /**
   * Start health monitoring for all active integrations
   */
  private startMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    // Check health every 5 minutes
    this.monitoringInterval = setInterval(async () => {
      await this.performHealthChecks();
    }, 5 * 60 * 1000);
  }

  /**
   * Perform health checks on all integrations
   */
  private async performHealthChecks(): Promise<void> {
    try {
      // Get all active integrations
      const { data: integrations, error } = await this.getActiveIntegrations();
      
      if (error || !integrations) {
        logger.error('Failed to get integrations for health check', { error });
        return;
      }

      // Perform health checks in parallel
      const healthChecks = integrations.map(integration => 
        this.checkIntegrationHealth(integration.id)
      );

      await Promise.allSettled(healthChecks);

    } catch (error) {
      logger.error('Health check failed', { error });
    }
  }

  /**
   * Check health of a specific integration
   */
  async checkIntegrationHealth(integrationId: string): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      // Load the integration
      const { integrationRuntime } = await import('@/lib/integrationRuntime');
      const instance = await integrationRuntime.loadIntegration(integrationId);
      
      // Test connection
      const isConnected = await instance.testConnection();
      const responseTime = Date.now() - startTime;

      const result: HealthCheckResult = {
        success: isConnected,
        responseTime,
        timestamp: new Date().toISOString(),
      };

      // Update metrics
      this.updateHealthMetrics(integrationId, result);

      return result;

    } catch (error) {
      const responseTime = Date.now() - startTime;
      const result: HealthCheckResult = {
        success: false,
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      };

      this.updateHealthMetrics(integrationId, result);
      return result;
    }
  }

  /**
   * Update health metrics for an integration
   */
  private updateHealthMetrics(integrationId: string, result: HealthCheckResult): void {
    const current = this.healthMetrics.get(integrationId) || this.initializeMetrics(integrationId);
    
    current.totalCalls++;
    current.responseTime = (current.responseTime + result.responseTime) / 2;

    if (result.success) {
      current.successfulCalls++;
      current.consecutiveFailures = 0;
      current.lastSuccessfulCall = result.timestamp;
      current.errorRate = (current.failedCalls / current.totalCalls) * 100;
    } else {
      current.failedCalls++;
      current.consecutiveFailures++;
      current.lastError = result.error;
      current.errorRate = (current.failedCalls / current.totalCalls) * 100;
    }

    // Update status based on metrics
    current.status = this.calculateStatus(current);
    current.uptime = (current.successfulCalls / current.totalCalls) * 100;

    this.healthMetrics.set(integrationId, current);

    // Log significant issues
    if (current.consecutiveFailures >= 3) {
      logger.warn('Integration health degraded', { 
        integrationId, 
        consecutiveFailures: current.consecutiveFailures,
        errorRate: current.errorRate 
      });
    }
  }

  /**
   * Initialize health metrics for a new integration
   */
  private initializeMetrics(integrationId: string): IntegrationHealthMetrics {
    return {
      integrationId,
      status: 'unknown',
      uptime: 100,
      responseTime: 0,
      errorRate: 0,
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      consecutiveFailures: 0,
    };
  }

  /**
   * Calculate integration status based on metrics
   */
  private calculateStatus(metrics: IntegrationHealthMetrics): 'healthy' | 'degraded' | 'failed' | 'unknown' {
    if (metrics.totalCalls === 0) return 'unknown';
    
    if (metrics.errorRate > 50 || metrics.consecutiveFailures >= 5) {
      return 'failed';
    }
    
    if (metrics.errorRate > 10 || metrics.consecutiveFailures >= 3) {
      return 'degraded';
    }
    
    return 'healthy';
  }

  /**
   * Get health metrics for an integration
   */
  async getIntegrationHealth(integrationId: string): Promise<ServiceResponse<IntegrationHealthMetrics>> {
    try {
      const metrics = this.healthMetrics.get(integrationId);
      
      if (!metrics) {
        // Perform initial health check
        await this.checkIntegrationHealth(integrationId);
        const newMetrics = this.healthMetrics.get(integrationId);
        
        if (newMetrics) {
          return this.createResponse(newMetrics);
        }
        
        return this.handleError('Integration not found');
      }

      return this.createResponse(metrics);

    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get health metrics for all integrations
   */
  async getAllIntegrationHealth(): Promise<ServiceResponse<IntegrationHealthMetrics[]>> {
    try {
      const metrics = Array.from(this.healthMetrics.values());
      return this.createResponse(metrics);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get integrations that need attention
   */
  async getUnhealthyIntegrations(): Promise<ServiceResponse<IntegrationHealthMetrics[]>> {
    try {
      const unhealthy = Array.from(this.healthMetrics.values())
        .filter(metrics => metrics.status === 'degraded' || metrics.status === 'failed');
      
      return this.createResponse(unhealthy);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Reset health metrics for an integration
   */
  async resetHealthMetrics(integrationId: string): Promise<ServiceResponse<boolean>> {
    try {
      this.healthMetrics.delete(integrationId);
      return this.createResponse(true);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get active integrations from database
   */
  private async getActiveIntegrations(): Promise<ServiceResponse<any[]>> {
    try {
      const { consolidatedIntegrationService } = await import('@/services/integrations/consolidatedIntegrationService');
      return await consolidatedIntegrationService.getUserIntegrations();
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Stop health monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  /**
   * Cleanup on service destruction
   */
  destroy(): void {
    this.stopMonitoring();
    this.healthMetrics.clear();
  }
}

// Export singleton instance
export const integrationHealthService = new IntegrationHealthService();
