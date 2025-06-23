import { ProductionSupervisorAgent, supervisorAgent } from '../../../src/features/ai-assistant/lib/agents/supervisor';
import type { Agent } from '../../../src/lib/agentRegistry';

describe('Production Supervisor Agent', () => {
  const mockSpecialists: Agent[] = [
    {
      id: 'tech-specialist',
      name: 'Technical Specialist',
      description: 'Handles technical issues',
      specialties: ['api', 'integration', 'database', 'code'],
      department: 'engineering',
      webhookUrl: 'https://test-webhook.com/tech',
      type: 'specialist',
      knowledgeBase: {
        domain: 'Technical Engineering',
        specializations: ['API Development', 'Database Management']
      },
      personality: {
        communicationStyle: 'analytical',
        expertise_level: 'expert',
        decision_making: 'data-driven',
        tone: 'professional'
      },
      systemPrompt: 'You are a technical specialist focused on API and database issues.'
    },
    {
      id: 'finance-specialist',
      name: 'Finance Specialist',
      description: 'Handles financial matters',
      specialties: ['budget', 'invoice', 'payment', 'revenue'],
      department: 'finance',
      webhookUrl: 'https://test-webhook.com/finance',
      type: 'specialist',
      knowledgeBase: {
        domain: 'Financial Operations',
        specializations: ['Budget Management', 'Invoice Processing']
      },
      personality: {
        communicationStyle: 'analytical',
        expertise_level: 'expert',
        decision_making: 'data-driven',
        tone: 'professional'
      },
      systemPrompt: 'You are a finance specialist focused on budget and payment issues.'
    },
    {
      id: 'security-specialist',
      name: 'Security Specialist',
      description: 'Handles security issues',
      specialties: ['security', 'auth', 'permissions', 'compliance'],
      department: 'security',
      webhookUrl: 'https://test-webhook.com/security',
      type: 'specialist',
      knowledgeBase: {
        domain: 'Information Security',
        specializations: ['Authentication', 'Compliance']
      },
      personality: {
        communicationStyle: 'analytical',
        expertise_level: 'expert',
        decision_making: 'data-driven',
        tone: 'authoritative'
      },
      systemPrompt: 'You are a security specialist focused on auth and compliance issues.'
    }
  ];

  const supervisor = new ProductionSupervisorAgent();

  describe('Intent Analysis', () => {
    it('should correctly identify technical intents', async () => {
      const response = await supervisor.route('I need help with API integration error', {
        specialists: mockSpecialists
      });

      expect(response.routeToAgentId).toBe('tech-specialist');
      expect(response.confidence).toBeGreaterThan(0.6);
      expect(response.content).toContain('Technical Specialist');
      expect(response.metadata?.intentAnalysis).toBeDefined();
    });

    it('should correctly identify financial intents', async () => {
      const response = await supervisor.route('I need to create an invoice for our client', {
        specialists: mockSpecialists
      });

      expect(response.routeToAgentId).toBe('finance-specialist');
      expect(response.confidence).toBeGreaterThan(0.5);
      expect(response.content).toContain('Finance Specialist');
    });

    it('should detect urgency and escalate appropriately', async () => {
      const response = await supervisor.route('URGENT: Our database is down and customers cannot access the system!', {
        specialists: mockSpecialists
      });

      expect(response.metadata?.escalated).toBe(true);
      expect(response.confidence).toBeGreaterThan(0.8);
      expect(response.content).toContain('escalating');
    });
  });

  describe('Context Awareness', () => {
    it('should use conversation history for better routing', async () => {
      const conversationHistory = [
        {
          message: 'previous technical question',
          agentId: 'tech-specialist',
          timestamp: new Date(),
          outcome: 'successful' as const
        }
      ];

      const response = await supervisor.route('I have another question about APIs', {
        specialists: mockSpecialists,
        conversationHistory
      });

      expect(response.routeToAgentId).toBe('tech-specialist');
      expect(response.reasoning).toContain('success rate');
    });

    it('should respect user preferences', async () => {
      const response = await supervisor.route('I need help with security', {
        specialists: mockSpecialists,
        userContext: {
          preferredAgents: ['security-specialist']
        }
      });

      expect(response.routeToAgentId).toBe('security-specialist');
      expect(response.reasoning).toContain('preferred agent');
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully', async () => {
      // Simulate an error by passing invalid data
      const response = await supervisor.route('test message', {
        specialists: null as any // This should cause an error
      });

      expect(response.metadata?.error).toBe(true);
      expect(response.metadata?.fallbackToGeneral).toBe(true);
      expect(response.confidence).toBeLessThan(0.5);
    });
  });

  describe('Uncertainty Handling', () => {
    it('should request clarification for ambiguous requests', async () => {
      const response = await supervisor.route('I need help', {
        specialists: mockSpecialists
      });

      expect(response.metadata?.needsClarification).toBe(true);
      expect(response.confidence).toBeLessThan(0.5);
      expect(response.content).toContain('more detail');
    });

    it('should offer uncertain matches with explanation', async () => {
      const response = await supervisor.route('I have a small budget question', {
        specialists: mockSpecialists
      });

      if (response.confidence > 0.3 && response.confidence < 0.6) {
        expect(response.metadata?.uncertainMatch).toBe(true);
        expect(response.content).toContain('not completely certain');
      }
    });
  });

  describe('Performance Metrics', () => {
    it('should include performance metadata', async () => {
      const response = await supervisor.route('API integration help needed', {
        specialists: mockSpecialists
      });

      expect(response.metadata?.processingTime).toBeDefined();
      expect(response.metadata?.intentConfidence).toBeDefined();
      expect(response.metadata?.routingConfidence).toBeDefined();
      expect(response.metadata?.estimatedResolutionTime).toBeDefined();
    });
  });

  describe('Legacy Compatibility', () => {
    it('should maintain compatibility with legacy supervisorAgent function', async () => {
      const response = await supervisorAgent('I need help with database issues', {
        specialists: mockSpecialists
      });

      expect(response).toBeDefined();
      expect(response.content).toBeDefined();
      expect(response.confidence).toBeDefined();
      expect(typeof response.confidence).toBe('number');
    });
  });

  describe('Multi-domain Routing', () => {
    it('should handle multi-domain requests appropriately', async () => {
      const response = await supervisor.route('I need to integrate our payment API with the security system for invoice processing', {
        specialists: mockSpecialists
      });

      // Should route to the most relevant specialist or suggest multiple
      expect(response.routeToAgentId).toBeDefined();
      expect(response.metadata?.fallbackAgents).toBeDefined();
      expect(response.confidence).toBeGreaterThan(0.3);
    });
  });
}); 