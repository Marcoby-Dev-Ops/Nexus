import { ContextualRAG } from '../../src/lib/ai/contextualRAG';

// Mock the supabase client
jest.mock('../../src/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null
      })
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ 
        data: {
          profile: {
            id: 'test-user-id',
            name: 'Test User',
            role: 'VP of Sales',
            department: 'Sales'
          }
        }, 
        error: null 
      })
    }))
  }
}));

// Mock the business observation service
jest.mock('../../src/lib/services/businessObservationService', () => ({
  businessObservationService: {
    generateBusinessObservations: jest.fn().mockResolvedValue([])
  }
}));

describe('ContextualRAG Core Functionality', () => {
  let ragSystem: ContextualRAG;

  beforeEach(() => {
    ragSystem = new ContextualRAG();
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize successfully with valid user ID', async () => {
      await expect(ragSystem.initialize('test-user-id')).resolves.not.toThrow();
    });

    it('should throw error when initializing with invalid user ID', async () => {
      await expect(ragSystem.initialize('')).rejects.toThrow();
    });

    it('should handle initialization within reasonable time', async () => {
      const start = performance.now();
      await ragSystem.initialize('test-user-id');
      const end = performance.now();
      
      expect(end - start).toBeLessThan(1000); // Should initialize within 1 second
    });
  });

  describe('Executive Context Generation', () => {
    beforeEach(async () => {
      await ragSystem.initialize('test-user-id');
    });

    it('should generate executive context for strategic queries', async () => {
      const context = await ragSystem.getExecutiveContext('What should be our Q1 priorities?');
      
      expect(context).toBeDefined();
      expect(context.length).toBeGreaterThan(0);
      expect(context).toContain('EXECUTIVE CONTEXT');
    });

    it('should include user intelligence in executive responses', async () => {
      const context = await ragSystem.getExecutiveContext('How is the company performing?');
      
      expect(context).toContain('USER INTELLIGENCE');
      expect(context).toContain('BUSINESS CONTEXT');
    });

    it('should handle executive context generation efficiently', async () => {
      const start = performance.now();
      await ragSystem.getExecutiveContext('Test executive query');
      const end = performance.now();
      
      expect(end - start).toBeLessThan(500); // Should be fast
    });

    it('should throw error when not initialized', async () => {
      const uninitializedRAG = new ContextualRAG();
      
      await expect(
        uninitializedRAG.getExecutiveContext('test query')
      ).rejects.toThrow('RAG system not initialized');
    });
  });

  describe('Department Context Generation', () => {
    beforeEach(async () => {
      await ragSystem.initialize('test-user-id');
    });

    it('should generate sales department context', async () => {
      const context = await ragSystem.getDepartmentContext('sales', 'Show me sales performance');
      
      expect(context).toBeDefined();
      expect(context.length).toBeGreaterThan(0);
      expect(context).toContain('SALES');
    });

    it('should generate marketing department context', async () => {
      const context = await ragSystem.getDepartmentContext('marketing', 'How are campaigns performing?');
      
      expect(context).toBeDefined();
      expect(context.length).toBeGreaterThan(0);
      expect(context).toContain('MARKETING');
    });

    it('should generate finance department context', async () => {
      const context = await ragSystem.getDepartmentContext('finance', 'What is our financial position?');
      
      expect(context).toBeDefined();
      expect(context.length).toBeGreaterThan(0);
      expect(context).toContain('FINANCE');
    });

    it('should generate operations department context', async () => {
      const context = await ragSystem.getDepartmentContext('operations', 'Show me project status');
      
      expect(context).toBeDefined();
      expect(context.length).toBeGreaterThan(0);
      expect(context).toContain('OPERATIONS');
    });

    it('should include user profile in department context', async () => {
      const context = await ragSystem.getDepartmentContext('sales', 'Show me sales performance');
      
      expect(context).toContain('USER PROFILE');
      expect(context).toContain('DEPARTMENT CONTEXT');
    });

    it('should handle invalid department gracefully', async () => {
      const context = await ragSystem.getDepartmentContext('invalid-department', 'test query');
      
      expect(context).toBeDefined();
      expect(context.length).toBeGreaterThan(0);
    });

    it('should throw error when not initialized', async () => {
      const uninitializedRAG = new ContextualRAG();
      
      await expect(
        uninitializedRAG.getDepartmentContext('sales', 'test query')
      ).rejects.toThrow('RAG system not initialized');
    });
  });

  describe('Query Routing Intelligence', () => {
    beforeEach(async () => {
      await ragSystem.initialize('test-user-id');
    });

    it('should provide routing intelligence for queries', async () => {
      const routing = await ragSystem.getRoutingIntelligence('Show me our sales performance');
      
      expect(routing).toBeDefined();
      expect(routing.recommendedAgent).toBeDefined();
      expect(routing.confidence).toBeGreaterThan(0);
      expect(routing.confidence).toBeLessThanOrEqual(1);
      expect(routing.reasoning).toBeDefined();
    });

    it('should handle different query types', async () => {
      const queries = [
        'Show me sales performance',
        'How are our marketing campaigns?',
        'What is our financial position?',
        'What are our project statuses?'
      ];

      for (const query of queries) {
        const routing = await ragSystem.getRoutingIntelligence(query);
        expect(routing.recommendedAgent).toBeDefined();
        expect(routing.confidence).toBeGreaterThan(0);
      }
    });

    it('should throw error when not initialized', async () => {
      const uninitializedRAG = new ContextualRAG();
      
      await expect(
        uninitializedRAG.getRoutingIntelligence('test query')
      ).rejects.toThrow('RAG system not initialized');
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // Mock database error
      const { supabase } = await import('../../src/lib/supabase');
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockRejectedValue(new Error('Database connection failed'))
      });

      const newRAG = new ContextualRAG();
      
      // Should handle error gracefully and use default context
      await expect(newRAG.initialize('test-user-id')).resolves.not.toThrow();
    });

    it('should handle invalid query parameters', async () => {
      await ragSystem.initialize('test-user-id');
      
      // Test with empty queries
      await expect(ragSystem.getExecutiveContext('')).resolves.not.toThrow();
      await expect(ragSystem.getDepartmentContext('sales', '')).resolves.not.toThrow();
    });

    it('should handle memory constraints with large queries', async () => {
      await ragSystem.initialize('test-user-id');
      
      // Test with very large query
      const largeQuery = 'test '.repeat(1000);
      
      await expect(ragSystem.getExecutiveContext(largeQuery)).resolves.not.toThrow();
    });
  });

  describe('Performance Tests', () => {
    beforeEach(async () => {
      await ragSystem.initialize('test-user-id');
    });

    it('should handle concurrent context generation', async () => {
      const promises = [
        ragSystem.getExecutiveContext('Executive query 1'),
        ragSystem.getDepartmentContext('sales', 'Sales query 1'),
        ragSystem.getDepartmentContext('marketing', 'Marketing query 1'),
        ragSystem.getDepartmentContext('finance', 'Finance query 1')
      ];

      const results = await Promise.all(promises);
      
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.length).toBeGreaterThan(0);
      });
    });

    it('should maintain performance under load', async () => {
      const iterations = 5;
      const promises = [];

      for (let i = 0; i < iterations; i++) {
        promises.push(ragSystem.getExecutiveContext(`Test query ${i}`));
      }

      const startTime = performance.now();
      await Promise.all(promises);
      const endTime = performance.now();

      const averageTime = (endTime - startTime) / iterations;
      expect(averageTime).toBeLessThan(200); // Average should be reasonable
    });
  });

  describe('Context Content Quality', () => {
    beforeEach(async () => {
      await ragSystem.initialize('test-user-id');
    });

    it('should provide relevant context for business queries', async () => {
      const context = await ragSystem.getExecutiveContext('What are our key business metrics?');
      
      expect(context).toContain('BUSINESS');
      expect(context).toContain('METRICS');
    });

    it('should include personalization in responses', async () => {
      const context = await ragSystem.getExecutiveContext('Help me prioritize my tasks');
      
      expect(context).toContain('PERSONALIZATION');
    });

    it('should provide actionable insights', async () => {
      const context = await ragSystem.getDepartmentContext('sales', 'How can I improve our sales?');
      
      expect(context).toContain('RECOMMENDATIONS');
    });
  });
}); 