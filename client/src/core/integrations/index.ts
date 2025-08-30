/**
 * Integration Service
 * 
 * Main entry point for the Nexus Integration SDK
 * Provides unified interface for all integration operations
 */

export * from './types';
export * from './http-client';
export * from './webhooks';
export * from './connector-base';
export * from './worker';
export * from './registry';

import type { BaseConnector } from './connector-base';
import { ConnectorFactory } from './connector-base';
import type { ConnectorContext, SyncResult, WebhookEvent, IntegrationMetrics } from './types';
import { integrationWorkerManager } from './worker';
import type { ConnectorType } from './registry';
import { initializeConnectors, getConnectorRegistry } from './registry';
import { logger } from '@/shared/utils/logger';

/**
 * Integration Service
 * 
 * Main service for managing integrations in Nexus
 */
export class IntegrationService {
  private static instance: IntegrationService;
  private initialized = false;

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): IntegrationService {
    if (!IntegrationService.instance) {
      IntegrationService.instance = new IntegrationService();
    }
    return IntegrationService.instance;
  }

  /**
   * Initialize the integration service
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      logger.warn('Integration service already initialized');
      return;
    }

    logger.info('Initializing integration service');

    try {
      // Initialize connector registry
      initializeConnectors();

      // Initialize worker manager
      await integrationWorkerManager.initialize();

      this.initialized = true;
      logger.info('Integration service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize integration service', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get all available connectors
   */
  getAvailableConnectors() {
    const registry = getConnectorRegistry();
    return registry.getAllConnectors();
  }

  /**
   * Get connector by ID
   */
  getConnector(id: ConnectorType) {
    const registry = getConnectorRegistry();
    return registry.getConnector(id);
  }

  /**
   * Check if connector is available
   */
  hasConnector(id: ConnectorType): boolean {
    const registry = getConnectorRegistry();
    return registry.hasConnector(id);
  }

  /**
   * Get connector instance
   */
  getConnectorInstance(id: ConnectorType): BaseConnector | undefined {
    return ConnectorFactory.get(id);
  }

  // ============================================================================
  // AUTHENTICATION
  // ============================================================================

  /**
   * Authorize a connector
   */
  async authorizeConnector(
    connectorId: ConnectorType,
    tenantId: string,
    installId: string,
    code: string
  ): Promise<ConnectorContext> {
    const connector = ConnectorFactory.get(connectorId);
    if (!connector) {
      throw new Error(`Connector not found: ${connectorId}`);
    }

    const ctx: ConnectorContext = {
      tenantId,
      installId,
      auth: {
        accessToken: '',
      },
      config: {},
      metadata: {
        provider: connectorId,
        version: connector.version,
      },
    };

    return await connector.authorize(ctx, code);
  }

  /**
   * Refresh connector authentication
   */
  async refreshConnector(
    connectorId: ConnectorType,
    ctx: ConnectorContext
  ): Promise<ConnectorContext> {
    const connector = ConnectorFactory.get(connectorId);
    if (!connector) {
      throw new Error(`Connector not found: ${connectorId}`);
    }

    return await connector.refresh(ctx);
  }

  // ============================================================================
  // DATA SYNCHRONIZATION
  // ============================================================================

  /**
   * Start a backfill sync
   */
  async startBackfill(
    connectorId: ConnectorType,
    tenantId: string,
    installId: string,
    cursor?: string
  ): Promise<string> {
    if (!this.initialized) {
      throw new Error('Integration service not initialized');
    }

    const connector = ConnectorFactory.get(connectorId);
    if (!connector) {
      throw new Error(`Connector not found: ${connectorId}`);
    }

    return await integrationWorkerManager.scheduleBackfillJob({
      connectorId,
      tenantId,
      installId,
      cursor,
      priority: 5, // Normal priority
    });
  }

  /**
   * Start a delta sync
   */
  async startDelta(
    connectorId: ConnectorType,
    tenantId: string,
    installId: string,
    cursor?: string
  ): Promise<string> {
    if (!this.initialized) {
      throw new Error('Integration service not initialized');
    }

    const connector = ConnectorFactory.get(connectorId);
    if (!connector) {
      throw new Error(`Connector not found: ${connectorId}`);
    }

    return await integrationWorkerManager.scheduleDeltaJob({
      connectorId,
      tenantId,
      installId,
      cursor,
      priority: 5, // Normal priority
    });
  }

  /**
   * Perform immediate sync (for testing/debugging)
   */
  async syncImmediate(
    connectorId: ConnectorType,
    ctx: ConnectorContext,
    type: 'backfill' | 'delta' = 'delta',
    cursor?: string
  ): Promise<SyncResult> {
    const connector = ConnectorFactory.get(connectorId);
    if (!connector) {
      throw new Error(`Connector not found: ${connectorId}`);
    }

    if (type === 'backfill') {
      return await connector.backfill(ctx, cursor);
    } else {
      return await connector.delta(ctx, cursor);
    }
  }

  // ============================================================================
  // WEBHOOK HANDLING
  // ============================================================================

  /**
   * Process webhook
   */
  async processWebhook(
    connectorId: ConnectorType,
    tenantId: string,
    installId: string,
    headers: Record<string, string>,
    body: any
  ): Promise<string> {
    if (!this.initialized) {
      throw new Error('Integration service not initialized');
    }

    return await integrationWorkerManager.scheduleWebhookJob(
      connectorId,
      tenantId,
      installId,
      headers,
      body
    );
  }

  /**
   * Process webhook immediately (for testing/debugging)
   */
  async processWebhookImmediate(
    connectorId: ConnectorType,
    ctx: ConnectorContext,
    headers: Record<string, string>,
    body: any
  ): Promise<WebhookEvent[]> {
    const connector = ConnectorFactory.get(connectorId);
    if (!connector) {
      throw new Error(`Connector not found: ${connectorId}`);
    }

    return await connector.handleWebhook(ctx, headers, body);
  }

  // ============================================================================
  // HEALTH CHECKS
  // ============================================================================

  /**
   * Schedule health check
   */
  async scheduleHealthCheck(
    connectorId: ConnectorType,
    tenantId: string,
    installId: string,
    delay: number = 0
  ): Promise<string> {
    if (!this.initialized) {
      throw new Error('Integration service not initialized');
    }

    return await integrationWorkerManager.scheduleHealthJob(
      connectorId,
      tenantId,
      installId,
      delay
    );
  }

  /**
   * Perform immediate health check
   */
  async healthCheckImmediate(
    connectorId: ConnectorType,
    ctx: ConnectorContext
  ): Promise<{ healthy: boolean; details?: any }> {
    const connector = ConnectorFactory.get(connectorId);
    if (!connector) {
      throw new Error(`Connector not found: ${connectorId}`);
    }

    return await connector.healthCheck(ctx);
  }

  // ============================================================================
  // CONFIGURATION
  // ============================================================================

  /**
   * Validate connector configuration
   */
  validateConnectorConfig(connectorId: ConnectorType, config: any): boolean {
    const registry = getConnectorRegistry();
    return registry.validateConnectorConfig(connectorId, config);
  }

  /**
   * Get connector configuration schema
   */
  getConnectorConfigSchema(connectorId: ConnectorType): any {
    const registry = getConnectorRegistry();
    return registry.getConnectorConfigSchema(connectorId);
  }

  // ============================================================================
  // MONITORING & METRICS
  // ============================================================================

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<Record<string, any>> {
    if (!this.initialized) {
      throw new Error('Integration service not initialized');
    }

    return await integrationWorkerManager.getQueueStats();
  }

  /**
   * Get connector statistics
   */
  getConnectorStats(): Record<string, any> {
    const connectors = ConnectorFactory.getAll();
    const stats: Record<string, any> = {};

    for (const connector of connectors) {
      stats[connector.id] = {
        name: connector.name,
        version: connector.version,
        status: 'active',
      };
    }

    return stats;
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Get connectors by feature
   */
  getConnectorsByFeature(feature: string) {
    const registry = getConnectorRegistry();
    return registry.getConnectorsByFeature(feature);
  }

  /**
   * Get connectors by auth type
   */
  getConnectorsByAuthType(authType: string) {
    const registry = getConnectorRegistry();
    return registry.getConnectorsByAuthType(authType);
  }

  /**
   * Get webhook-supported connectors
   */
  getWebhookSupportedConnectors() {
    const registry = getConnectorRegistry();
    return registry.getWebhookSupportedConnectors();
  }

  /**
   * Check if service is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Shutdown the integration service
   */
  async shutdown(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    logger.info('Shutting down integration service');

    try {
      await integrationWorkerManager.shutdown();
      this.initialized = false;
      logger.info('Integration service shutdown complete');
    } catch (error) {
      logger.error('Error during integration service shutdown', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}

// Export singleton instance
export const integrationService = IntegrationService.getInstance();

// Export convenience functions
export const initializeIntegrationService = () => integrationService.initialize();
export const shutdownIntegrationService = () => integrationService.shutdown();
