/**
 * n8nWorkflowBuilder.test.ts
 * Tests for the enhanced n8n workflow builder
 */

import { n8nWorkflowBuilder, type WorkflowGenerationRequest } from '../n8nWorkflowBuilder';
import { userN8nConfigService } from '../userN8nConfig';

// Mock the userN8nConfigService
jest.mock('../userN8nConfig', () => ({
  userN8nConfigService: {
    getCurrentUserConfig: jest.fn().mockResolvedValue({
      userId: 'test-user-id',
      baseUrl: 'https://test-n8n.com',
      apiKey: 'test-api-key',
      isActive: true
    })
  }
}));

// Type assertion for mocked function
const mockGetCurrentUserConfig = userN8nConfigService.getCurrentUserConfig as jest.MockedFunction<typeof userN8nConfigService.getCurrentUserConfig>;

describe('N8nWorkflowBuilder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateFromDescription', () => {
    it('should generate workflow from simple description', async () => {
      const description = 'Create a workflow that receives webhook data and saves it to database';
      
      const result = await n8nWorkflowBuilder.generateFromDescription(description);
      
      expect(result.success).toBe(true);
      expect(result.workflowDefinition).toBeDefined();
      expect(result.workflowId).toBeDefined();
      expect(result.workflowDefinition?.nodes.length).toBeGreaterThan(0);
    });

    it('should include webhook trigger for webhook-based workflows', async () => {
      const description = 'Webhook workflow for processing customer data';
      
      const result = await n8nWorkflowBuilder.generateFromDescription(description);
      
      expect(result.success).toBe(true);
      const triggerNode = result.workflowDefinition?.nodes.find(
        node => node.type === 'n8n-nodes-base.webhook'
      );
      expect(triggerNode).toBeDefined();
      expect(triggerNode?.webhookId).toBeDefined();
    });

    it('should include schedule trigger for scheduled workflows', async () => {
      const description = 'Daily scheduled workflow to process reports';
      
      const result = await n8nWorkflowBuilder.generateFromDescription(description);
      
      if (!result.success) {
        console.log('Error:', result.error);
      }
      expect(result.success).toBe(true);
      const triggerNode = result.workflowDefinition?.nodes.find(
        node => node.type === 'n8n-nodes-base.cron'
      );
      expect(triggerNode).toBeDefined();
    });

    it('should include email action for email workflows', async () => {
      const description = 'Send email notification when data is processed';
      
      const result = await n8nWorkflowBuilder.generateFromDescription(description);
      
      expect(result.success).toBe(true);
      const emailNode = result.workflowDefinition?.nodes.find(
        node => node.type === 'n8n-nodes-base.emailSend'
      );
      expect(emailNode).toBeDefined();
    });

    it('should include database action for database workflows', async () => {
      const description = 'Save customer data to database after processing';
      
      const result = await n8nWorkflowBuilder.generateFromDescription(description);
      
      expect(result.success).toBe(true);
      const dbNode = result.workflowDefinition?.nodes.find(
        node => node.type === 'n8n-nodes-base.postgres'
      );
      expect(dbNode).toBeDefined();
    });
  });

  describe('generateWorkflow', () => {
    it('should generate complete workflow from request', async () => {
      const request: WorkflowGenerationRequest = {
        name: 'Test Workflow',
        description: 'Test workflow for validation',
        triggerType: 'webhook',
        integrations: ['hubspot'],
        actions: [
          {
            type: 'database',
            name: 'Save Data',
            parameters: { table: 'test_data' }
          },
          {
            type: 'email',
            name: 'Send Notification',
            parameters: { subject: 'Test Email' }
          }
        ],
        department: 'operations'
      };

      const result = await n8nWorkflowBuilder.generateWorkflow(request);

      expect(result.success).toBe(true);
      expect(result.workflowDefinition?.name).toBe('Test Workflow');
      expect(result.workflowDefinition?.nodes.length).toBeGreaterThanOrEqual(4); // trigger + 2 actions + integration + response
    });

    it('should create proper node connections', async () => {
      const request: WorkflowGenerationRequest = {
        name: 'Connection Test',
        description: 'Test node connections',
        triggerType: 'webhook',
        integrations: [],
        actions: [
          {
            type: 'transform',
            name: 'Process Data',
            parameters: {}
          }
        ]
      };

      const result = await n8nWorkflowBuilder.generateWorkflow(request);

      expect(result.success).toBe(true);
      expect(result.workflowDefinition?.connections).toBeDefined();
      
      // Check that trigger is connected to first action
      const connections = result.workflowDefinition?.connections;
      expect(connections?.['Trigger']?.main).toBeDefined();
      expect(connections?.['Trigger']?.main?.[0]?.node).toBe('Process Data');
    });

    it('should validate workflow structure', async () => {
      const request: WorkflowGenerationRequest = {
        name: 'Validation Test',
        description: 'Test workflow validation',
        triggerType: 'manual',
        integrations: [],
        actions: []
      };

      const result = await n8nWorkflowBuilder.generateWorkflow(request);

      if (!result.success) {
        console.log('Error:', result.error);
      }
      expect(result.success).toBe(true);
      // Should have at least trigger and response nodes
      expect(result.workflowDefinition?.nodes.length).toBeGreaterThanOrEqual(2);
    });

    it('should generate webhook URL for webhook triggers', async () => {
      const request: WorkflowGenerationRequest = {
        name: 'Webhook Test',
        description: 'Test webhook URL generation',
        triggerType: 'webhook',
        integrations: [],
        actions: []
      };

      const result = await n8nWorkflowBuilder.generateWorkflow(request);

      expect(result.success).toBe(true);
      expect(result.webhookUrl).toBeDefined();
      expect(result.webhookUrl).toContain('https://test-n8n.com/webhook/');
    });
  });

  describe('error handling', () => {
    it('should handle missing n8n configuration', async () => {
      // Mock missing configuration
      mockGetCurrentUserConfig.mockResolvedValueOnce(null);

      const result = await n8nWorkflowBuilder.generateFromDescription('test workflow');

      expect(result.success).toBe(false);
      expect(result.error).toContain('No active n8n configuration found');
    });

    it('should handle invalid configuration', async () => {
      // Mock invalid configuration
      mockGetCurrentUserConfig.mockResolvedValueOnce({
        userId: 'test-user-id',
        baseUrl: '',
        apiKey: '',
        isActive: true
      });

      const result = await n8nWorkflowBuilder.generateFromDescription('test workflow');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid URL or API key');
    });
  });

  describe('integration parsing', () => {
    it('should detect HubSpot integration from description', async () => {
      const description = 'Connect to HubSpot to sync customer data';
      
      const result = await n8nWorkflowBuilder.generateFromDescription(description);
      
      expect(result.success).toBe(true);
      const hubspotNode = result.workflowDefinition?.nodes.find(
        node => node.name.includes('hubspot')
      );
      expect(hubspotNode).toBeDefined();
    });

    it('should detect Salesforce integration from description', async () => {
      const description = 'Update Salesforce records with new lead information';
      
      const result = await n8nWorkflowBuilder.generateFromDescription(description);
      
      expect(result.success).toBe(true);
      const salesforceNode = result.workflowDefinition?.nodes.find(
        node => node.name.includes('salesforce')
      );
      expect(salesforceNode).toBeDefined();
    });
  });

  describe('workflow settings', () => {
    it('should set proper workflow settings', async () => {
      const request: WorkflowGenerationRequest = {
        name: 'Settings Test',
        description: 'Test workflow settings',
        triggerType: 'webhook',
        integrations: [],
        actions: []
      };

      const result = await n8nWorkflowBuilder.generateWorkflow(request);

      expect(result.success).toBe(true);
      expect(result.workflowDefinition?.settings).toEqual({
        executionOrder: 'v1',
        saveManualExecutions: true,
        callerPolicy: 'workflowsFromSameOwner'
      });
      expect(result.workflowDefinition?.active).toBe(false);
    });
  });
}); 