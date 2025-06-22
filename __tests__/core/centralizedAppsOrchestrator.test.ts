import { centralizedAppsOrchestrator } from '../../src/lib/centralizedAppsOrchestrator';

// Mock dependencies
jest.mock('../../src/lib/n8nService');
jest.mock('../../src/lib/agentRegistry');
jest.mock('../../src/lib/chatContext');

describe('CentralizedAppsOrchestrator - Core Business Logic', () => {
  let orchestrator: any;

  beforeEach(() => {
    // Use the orchestrator instance for each test
    orchestrator = centralizedAppsOrchestrator;
  });

  describe('App Management', () => {
    it('should initialize core business applications', () => {
      const apps = orchestrator.getConnectedApps();
      
      // Verify core apps are present
      expect(apps.some((app: any) => app.id === 'salesforce')).toBe(true);
      expect(apps.some((app: any) => app.id === 'quickbooks')).toBe(true);
      expect(apps.some((app: any) => app.id === 'stripe')).toBe(true);
      expect(apps.some((app: any) => app.id === 'microsoft365')).toBe(true);
    });

    it('should track app status correctly', () => {
      const apps = orchestrator.getConnectedApps();
      const salesforce = apps.find((app: any) => app.id === 'salesforce');
      
      expect(salesforce).toBeDefined();
      expect(['connected', 'disconnected', 'configuring', 'error']).toContain(salesforce.status);
      expect(salesforce.integrationLevel).toMatch(/^(basic|advanced|deep)$/);
    });

    it('should provide app metrics', () => {
      const apps = orchestrator.getConnectedApps();
      const stripe = apps.find((app: any) => app.id === 'stripe');
      
      expect(stripe.metrics).toBeDefined();
      expect(typeof stripe.metrics.dailyAPIRequests).toBe('number');
      expect(typeof stripe.metrics.successRate).toBe('number');
      expect(stripe.metrics.successRate).toBeGreaterThanOrEqual(0);
      expect(stripe.metrics.successRate).toBeLessThanOrEqual(100);
    });
  });

  describe('Business Functions', () => {
    it('should initialize core business functions', () => {
      const functions = orchestrator.getBusinessFunctions();
      
      expect(functions.length).toBeGreaterThan(0);
      expect(functions.some((f: any) => f.id === 'lead-to-cash')).toBe(true);
      expect(functions.some((f: any) => f.id === 'financial-reporting')).toBe(true);
    });

    it('should validate business function structure', () => {
      const functions = orchestrator.getBusinessFunctions();
      const leadToCash = functions.find((f: any) => f.id === 'lead-to-cash');
      
      expect(leadToCash).toBeDefined();
      expect(leadToCash.requiredApps).toBeInstanceOf(Array);
      expect(leadToCash.supportingAgents).toBeInstanceOf(Array);
      expect(leadToCash.automationWorkflows).toBeInstanceOf(Array);
      expect(typeof leadToCash.automationLevel).toBe('number');
      expect(leadToCash.automationLevel).toBeGreaterThanOrEqual(0);
      expect(leadToCash.automationLevel).toBeLessThanOrEqual(100);
    });

    it('should calculate automation levels correctly', () => {
      const functions = orchestrator.getBusinessFunctions();
      
      functions.forEach((func: any) => {
        expect(func.automationLevel).toBeGreaterThanOrEqual(0);
        expect(func.automationLevel).toBeLessThanOrEqual(100);
        expect(typeof func.isAutomated).toBe('boolean');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle missing business functions gracefully', async () => {
      const result = await orchestrator.executeBusinessFunction('non-existent', {}, 'user-123');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Function not found');
      expect(result.results).toEqual([]);
      expect(result.agentsInvolved).toEqual([]);
      expect(result.workflowsTriggered).toEqual([]);
    });

    it('should handle app connection failures', () => {
      // Test that the system gracefully handles when apps are disconnected
      const disconnectedApps = orchestrator.getConnectedApps().filter((app: any) => app.status === 'error');
      
      // Should still provide structure even for failed apps
      disconnectedApps.forEach((app: any) => {
        expect(app.id).toBeDefined();
        expect(app.name).toBeDefined();
        expect(app.category).toBeDefined();
      });
    });
  });

  describe('Integration Health', () => {
    it('should provide health metrics for all apps', () => {
      const health = orchestrator.getSystemHealth();
      
      expect(health).toBeDefined();
      expect(typeof health.overallHealth).toBe('number');
      expect(health.overallHealth).toBeGreaterThanOrEqual(0);
      expect(health.overallHealth).toBeLessThanOrEqual(100);
    });

    it('should identify critical app dependencies', () => {
      const functions = orchestrator.getBusinessFunctions();
      const criticalApps = new Set();
      
      functions.forEach((func: any) => {
        func.requiredApps.forEach((app: string) => criticalApps.add(app));
      });
      
      expect(criticalApps.size).toBeGreaterThan(0);
      expect(criticalApps.has('salesforce')).toBe(true);
      expect(criticalApps.has('quickbooks')).toBe(true);
    });
  });
}); 