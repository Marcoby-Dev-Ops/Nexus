/**
 * Integration SDK Tests
 * 
 * Basic tests to verify the integration SDK components work correctly
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { 
  integrationService, 
  ConnectorFactory, 
  getConnectorRegistry,
  CONNECTOR_TYPES 
} from '../index';
import { HubSpotConnector } from '../connectors/hubspot';

describe('Integration SDK', () => {
  beforeEach(() => {
    // Clear any existing connectors
    ConnectorFactory.clear();
  });

  afterEach(async () => {
    // Cleanup
    if (integrationService.isInitialized()) {
      await integrationService.shutdown();
    }
  });

  describe('Connector Registry', () => {
    it('should register and retrieve connectors', () => {
      const registry = getConnectorRegistry();
      
      // Check that HubSpot is available
      expect(registry.hasConnector(CONNECTOR_TYPES.HUBSPOT)).toBe(true);
      
      const hubspot = registry.getConnector(CONNECTOR_TYPES.HUBSPOT);
      expect(hubspot).toBeDefined();
      expect(hubspot?.name).toBe('HubSpot');
      expect(hubspot?.authType).toBe('oauth2');
    });

    it('should get all available connectors', () => {
      const registry = getConnectorRegistry();
      const connectors = registry.getAllConnectors();
      
      expect(connectors.length).toBeGreaterThan(0);
      expect(connectors.some(c => c.id === CONNECTOR_TYPES.HUBSPOT)).toBe(true);
    });

    it('should get connectors by feature', () => {
      const registry = getConnectorRegistry();
      const webhookConnectors = registry.getConnectorsByFeature('webhook_support');
      
      expect(webhookConnectors.length).toBeGreaterThan(0);
      expect(webhookConnectors.every(c => c.webhookSupported)).toBe(true);
    });
  });

  describe('Connector Factory', () => {
    it('should register and retrieve connector instances', () => {
      const hubspot = new HubSpotConnector();
      ConnectorFactory.register(hubspot);
      
      const retrieved = ConnectorFactory.get('hubspot');
      expect(retrieved).toBe(hubspot);
      expect(retrieved?.id).toBe('hubspot');
      expect(retrieved?.name).toBe('HubSpot');
    });

    it('should check if connector exists', () => {
      expect(ConnectorFactory.exists('hubspot')).toBe(false);
      
      const hubspot = new HubSpotConnector();
      ConnectorFactory.register(hubspot);
      
      expect(ConnectorFactory.exists('hubspot')).toBe(true);
    });

    it('should get all registered connectors', () => {
      const hubspot = new HubSpotConnector();
      ConnectorFactory.register(hubspot);
      
      const connectors = ConnectorFactory.getAll();
      expect(connectors.length).toBe(1);
      expect(connectors[0]).toBe(hubspot);
    });
  });

  describe('Integration Service', () => {
    it('should initialize successfully', async () => {
      await integrationService.initialize();
      expect(integrationService.isInitialized()).toBe(true);
    });

    it('should get available connectors', async () => {
      await integrationService.initialize();
      
      const connectors = integrationService.getAvailableConnectors();
      expect(connectors.length).toBeGreaterThan(0);
    });

    it('should check if connector is available', async () => {
      await integrationService.initialize();
      
      expect(integrationService.hasConnector(CONNECTOR_TYPES.HUBSPOT)).toBe(true);
      expect(integrationService.hasConnector('nonexistent' as any)).toBe(false);
    });

    it('should get connector by ID', async () => {
      await integrationService.initialize();
      
      const hubspot = integrationService.getConnector(CONNECTOR_TYPES.HUBSPOT);
      expect(hubspot).toBeDefined();
      expect(hubspot?.name).toBe('HubSpot');
    });

    it('should validate connector configuration', async () => {
      await integrationService.initialize();
      
      const validConfig = {
        syncContacts: true,
        syncCompanies: true,
        batchSize: 50,
      };
      
      expect(integrationService.validateConnectorConfig(CONNECTOR_TYPES.HUBSPOT, validConfig)).toBe(true);
      expect(integrationService.validateConnectorConfig(CONNECTOR_TYPES.HUBSPOT, null)).toBe(false);
    });

    it('should get connector configuration schema', async () => {
      await integrationService.initialize();
      
      const schema = integrationService.getConnectorConfigSchema(CONNECTOR_TYPES.HUBSPOT);
      expect(schema).toBeDefined();
    });

    it('should get connectors by feature', async () => {
      await integrationService.initialize();
      
      const webhookConnectors = integrationService.getWebhookSupportedConnectors();
      expect(webhookConnectors.length).toBeGreaterThan(0);
      expect(webhookConnectors.every(c => c.webhookSupported)).toBe(true);
    });

    it('should get connector statistics', async () => {
      await integrationService.initialize();
      
      const stats = integrationService.getConnectorStats();
      expect(Object.keys(stats).length).toBeGreaterThan(0);
    });
  });

  describe('HubSpot Connector', () => {
    it('should create HubSpot connector instance', () => {
      const hubspot = new HubSpotConnector();
      
      expect(hubspot.id).toBe('hubspot');
      expect(hubspot.name).toBe('HubSpot');
      expect(hubspot.version).toBe('1.0.0');
    });

    it('should have configuration schema', () => {
      const hubspot = new HubSpotConnector();
      const schema = hubspot.getConfigSchema();
      
      expect(schema).toBeDefined();
    });

    it('should validate configuration', () => {
      const hubspot = new HubSpotConnector();
      
      const validConfig = {
        syncContacts: true,
        syncCompanies: true,
        batchSize: 50,
      };
      
      expect(hubspot.validateConfig(validConfig)).toBe(true);
    });
  });
});
