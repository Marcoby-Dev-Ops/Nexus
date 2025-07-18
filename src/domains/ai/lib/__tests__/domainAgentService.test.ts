/**
 * Domain Agent Service Tests
 * 
 * Tests for the domain agent service functionality including enhanced agents,
 * domain context, and specialized capabilities.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DomainAgentService } from '@/domains/ai/lib/domainAgentService';
import { agentRegistry } from '@/domains/ai/lib/agentRegistry';

// Mock Supabase
vi.mock('../../supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            gte: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn(() => Promise.resolve({ data: [], error: null }))
              }))
            }))
          }))
        }))
      }))
    }))
  }
}));

// Mock BusinessHealthService
vi.mock('../../services/businessHealthService', () => ({
  BusinessHealthService: vi.fn().mockImplementation(() => ({
    getBusinessHealth: vi.fn().mockResolvedValue({
      score: 85,
      breakdown: {
        sales: 78,
        marketing: 92,
        finance: 88,
        operations: 95,
        support: 82
      }
    })
  }))
}));

describe('DomainAgentService', () => {
  let domainAgentService: DomainAgentService;

  beforeEach(() => {
    domainAgentService = new DomainAgentService();
    vi.clearAllMocks();
  });

  describe('getEnhancedAgent', () => {
    it('should return enhanced agent with domain context for sales agent', async () => {
      const salesAgent = agentRegistry.find(agent => agent.id === 'sales-dept');
      if (!salesAgent) throw new Error('Sales agent not found in registry');

      const enhancedAgent = await domainAgentService.getEnhancedAgent('sales-dept', {
        companyId: 'test-company-123',
        role: 'sales_manager'
      });

      expect(enhancedAgent).toBeDefined();
      expect(enhancedAgent?.id).toBe('sales-dept');
      expect(enhancedAgent?.domainContext).toBeDefined();
      expect(enhancedAgent?.domainContext.departmentId).toBe('sales');
      expect(enhancedAgent?.domainContext.companyId).toBe('test-company-123');
      expect(enhancedAgent?.domainContext.userRole).toBe('sales_manager');
      expect(enhancedAgent?.availableTools).toContain('crm_integration');
      expect(enhancedAgent?.availableTools).toContain('pipeline_analysis');
      expect(enhancedAgent?.contextualKnowledge).toBeDefined();
      expect(enhancedAgent?.recentInsights).toBeDefined();
    });

    it('should return enhanced agent with domain context for marketing agent', async () => {
      const enhancedAgent = await domainAgentService.getEnhancedAgent('marketing-dept', {
        companyId: 'test-company-123'
      });

      expect(enhancedAgent).toBeDefined();
      expect(enhancedAgent?.domainContext.departmentId).toBe('marketing');
      expect(enhancedAgent?.availableTools).toContain('campaign_analysis');
      expect(enhancedAgent?.availableTools).toContain('seo_tools');
    });

    it('should return enhanced agent with domain context for finance agent', async () => {
      const enhancedAgent = await domainAgentService.getEnhancedAgent('finance-dept', {
        companyId: 'test-company-123'
      });

      expect(enhancedAgent).toBeDefined();
      expect(enhancedAgent?.domainContext.departmentId).toBe('finance');
      expect(enhancedAgent?.availableTools).toContain('financial_modeling');
      expect(enhancedAgent?.availableTools).toContain('budget_analysis');
    });

    it('should return enhanced agent with domain context for operations agent', async () => {
      const enhancedAgent = await domainAgentService.getEnhancedAgent('operations-dept', {
        companyId: 'test-company-123'
      });

      expect(enhancedAgent).toBeDefined();
      expect(enhancedAgent?.domainContext.departmentId).toBe('operations');
      expect(enhancedAgent?.availableTools).toContain('process_optimization');
      expect(enhancedAgent?.availableTools).toContain('automation_tools');
    });

    it('should return enhanced executive agent', async () => {
      const enhancedAgent = await domainAgentService.getEnhancedAgent('executive', {
        companyId: 'test-company-123'
      });

      expect(enhancedAgent).toBeDefined();
      expect(enhancedAgent?.domainContext.departmentId).toBe('executive');
      expect(enhancedAgent?.availableTools).toContain('web_search');
      expect(enhancedAgent?.availableTools).toContain('data_analysis');
    });

    it('should return null for non-existent agent', async () => {
      const enhancedAgent = await domainAgentService.getEnhancedAgent('non-existent-agent');

      expect(enhancedAgent).toBeNull();
    });

    it('should handle missing user context gracefully', async () => {
      const enhancedAgent = await domainAgentService.getEnhancedAgent('sales-dept');

      expect(enhancedAgent).toBeDefined();
      expect(enhancedAgent?.domainContext.companyId).toBeUndefined();
      expect(enhancedAgent?.domainContext.userRole).toBeUndefined();
    });
  });

  describe('generateEnhancedSystemPrompt', () => {
    it('should generate enhanced system prompt with business context', async () => {
      const enhancedAgent = await domainAgentService.getEnhancedAgent('sales-dept', {
        companyId: 'test-company-123'
      });

      if (!enhancedAgent) throw new Error('Enhanced agent should be defined');

      const enhancedPrompt = domainAgentService.generateEnhancedSystemPrompt(enhancedAgent);

      expect(enhancedPrompt).toContain(enhancedAgent.systemPrompt);
      expect(enhancedPrompt).toContain('CURRENT BUSINESS CONTEXT');
      expect(enhancedPrompt).toContain('Overall business health score: 85/100');
      expect(enhancedPrompt).toContain('Department score: 78/100');
      expect(enhancedPrompt).toContain('AVAILABLE TOOLS');
      expect(enhancedPrompt).toContain('crm_integration');
      expect(enhancedPrompt).toContain('CONTEXTUAL KNOWLEDGE');
    });

    it('should include recent insights in enhanced prompt', async () => {
      const enhancedAgent = await domainAgentService.getEnhancedAgent('sales-dept', {
        companyId: 'test-company-123'
      });

      if (!enhancedAgent) throw new Error('Enhanced agent should be defined');

      // Mock some insights
      enhancedAgent.recentInsights = ['Pipeline value increased 15%', 'Conversion rate at 22%'];

      const enhancedPrompt = domainAgentService.generateEnhancedSystemPrompt(enhancedAgent);

      expect(enhancedPrompt).toContain('RECENT INSIGHTS');
      expect(enhancedPrompt).toContain('Pipeline value increased 15%');
      expect(enhancedPrompt).toContain('Conversion rate at 22%');
    });

    it('should include contextual knowledge in enhanced prompt', async () => {
      const enhancedAgent = await domainAgentService.getEnhancedAgent('marketing-dept', {
        companyId: 'test-company-123'
      });

      if (!enhancedAgent) throw new Error('Enhanced agent should be defined');

      const enhancedPrompt = domainAgentService.generateEnhancedSystemPrompt(enhancedAgent);

      expect(enhancedPrompt).toContain('CONTEXTUAL KNOWLEDGE');
      expect(enhancedPrompt).toContain('Current business health score');
    });
  });

  describe('getDepartmentAgents', () => {
    it('should return agents for sales department', () => {
      const salesAgents = domainAgentService.getDepartmentAgents('sales');
      
      expect(salesAgents.length).toBeGreaterThan(0);
      expect(salesAgents.every(agent => agent.department === 'sales')).toBe(true);
    });

    it('should return agents for marketing department', () => {
      const marketingAgents = domainAgentService.getDepartmentAgents('marketing');
      
      expect(marketingAgents.length).toBeGreaterThan(0);
      expect(marketingAgents.every(agent => agent.department === 'marketing')).toBe(true);
    });

    it('should return empty array for non-existent department', () => {
      const nonExistentAgents = domainAgentService.getDepartmentAgents('non-existent');
      
      expect(nonExistentAgents).toEqual([]);
    });
  });

  describe('getAllDomainAgents', () => {
    it('should return all departmental and specialist agents', () => {
      const domainAgents = domainAgentService.getAllDomainAgents();
      
      expect(domainAgents.length).toBeGreaterThan(0);
      expect(domainAgents.every(agent => 
        agent.type === 'departmental' || agent.type === 'specialist'
      )).toBe(true);
      
      // Should not include executive agent
      expect(domainAgents.some(agent => agent.type === 'executive')).toBe(false);
    });

    it('should include agents from different departments', () => {
      const domainAgents = domainAgentService.getAllDomainAgents();
      
      const departments = new Set(domainAgents.map(agent => agent.department));
      expect(departments.size).toBeGreaterThan(1);
      expect(departments.has('sales')).toBe(true);
      expect(departments.has('marketing')).toBe(true);
      expect(departments.has('finance')).toBe(true);
      expect(departments.has('operations')).toBe(true);
    });
  });

  describe('Domain Context Building', () => {
    it('should build context with business health data', async () => {
      const enhancedAgent = await domainAgentService.getEnhancedAgent('sales-dept', {
        companyId: 'test-company-123'
      });

      expect(enhancedAgent?.domainContext.businessHealth).toBeDefined();
      expect(enhancedAgent?.domainContext.businessHealth.score).toBe(85);
      expect(enhancedAgent?.domainContext.businessHealth.breakdown.sales).toBe(78);
    });

    it('should handle business health service errors gracefully', async () => {
      // Mock business health service to throw error
      const mockBusinessHealthService = {
        getBusinessHealth: vi.fn().mockRejectedValue(new Error('Service unavailable'))
      };
      
      const service = new DomainAgentService();
      (service as any).businessHealthService = mockBusinessHealthService;

      const enhancedAgent = await service.getEnhancedAgent('sales-dept', {
        companyId: 'test-company-123'
      });

      expect(enhancedAgent).toBeDefined();
      expect(enhancedAgent?.domainContext.businessHealth).toBeUndefined();
    });
  });

  describe('Available Tools', () => {
    it('should include base tools for all agents', async () => {
      const enhancedAgent = await domainAgentService.getEnhancedAgent('sales-dept');

      expect(enhancedAgent?.availableTools).toContain('web_search');
      expect(enhancedAgent?.availableTools).toContain('data_analysis');
      expect(enhancedAgent?.availableTools).toContain('report_generation');
    });

    it('should include department-specific tools', async () => {
      const salesAgent = await domainAgentService.getEnhancedAgent('sales-dept');
      const marketingAgent = await domainAgentService.getEnhancedAgent('marketing-dept');
      const financeAgent = await domainAgentService.getEnhancedAgent('finance-dept');
      const operationsAgent = await domainAgentService.getEnhancedAgent('operations-dept');

      expect(salesAgent?.availableTools).toContain('crm_integration');
      expect(marketingAgent?.availableTools).toContain('campaign_analysis');
      expect(financeAgent?.availableTools).toContain('financial_modeling');
      expect(operationsAgent?.availableTools).toContain('process_optimization');
    });

    it('should not include department tools for executive agent', async () => {
      const executiveAgent = await domainAgentService.getEnhancedAgent('executive');

      expect(executiveAgent?.availableTools).not.toContain('crm_integration');
      expect(executiveAgent?.availableTools).not.toContain('campaign_analysis');
      expect(executiveAgent?.availableTools).toContain('web_search');
    });
  });

  describe('Contextual Knowledge', () => {
    it('should include agent frameworks and tools in knowledge', async () => {
      const salesAgent = await domainAgentService.getEnhancedAgent('sales-dept');

      expect(salesAgent?.contextualKnowledge).toBeDefined();
      expect(salesAgent?.contextualKnowledge.some(k => 
        k.includes('Frameworks:') || k.includes('Tools:')
      )).toBe(true);
    });

    it('should include business health information in knowledge', async () => {
      const salesAgent = await domainAgentService.getEnhancedAgent('sales-dept', {
        companyId: 'test-company-123'
      });

      expect(salesAgent?.contextualKnowledge.some(k => 
        k.includes('business health score')
      )).toBe(true);
      expect(salesAgent?.contextualKnowledge.some(k => 
        k.includes('sales department score')
      )).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      // Mock Supabase to throw error
      const mockSupabase = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                gte: vi.fn(() => ({
                  order: vi.fn(() => ({
                    limit: vi.fn(() => Promise.resolve({ data: null, error: new Error('DB Error') }))
                  }))
                }))
              }))
            }))
          }))
        }))
      };

      vi.doMock('../../supabase', () => ({ supabase: mockSupabase }));

      const enhancedAgent = await domainAgentService.getEnhancedAgent('sales-dept', {
        companyId: 'test-company-123'
      });

      expect(enhancedAgent).toBeDefined();
      expect(enhancedAgent?.domainContext.recentKPIs).toEqual({});
    });

    it('should provide fallback context when data is unavailable', async () => {
      const enhancedAgent = await domainAgentService.getEnhancedAgent('sales-dept');

      expect(enhancedAgent).toBeDefined();
      expect(enhancedAgent?.domainContext).toBeDefined();
      expect(enhancedAgent?.availableTools).toBeDefined();
      expect(enhancedAgent?.contextualKnowledge).toBeDefined();
      expect(enhancedAgent?.recentInsights).toBeDefined();
    });
  });
}); 