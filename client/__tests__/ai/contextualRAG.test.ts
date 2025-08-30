import { ContextualRAG } from '../../src/lib/ai/contextualRAG';
import { 
  mockUserContext, 
  mockDepartmentData, 
  createMockRAGSystem,
  expectValidRAGContext,
  measureExecutionTime,
  expectPerformanceThreshold,
  testQueries
} from '../utils/ragTestUtils';

// Mock the database queries
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
      single: jest.fn().mockResolvedValue({ data: mockUserContext, error: null })
    }))
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

    it('should handle initialization with non-existent user gracefully', async () => {
      // Mock database to return null user
      const { supabase } = await import('../../src/lib/supabase');
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null })
      });

      await ragSystem.initialize('non-existent-user');
      // Should not throw, should use default context
    });

    it('should initialize within performance threshold', async () => {
      const executionTime = await measureExecutionTime(async () => {
        await ragSystem.initialize('test-user-id');
      });

      expectPerformanceThreshold(executionTime, 1000); // 1 second threshold
    });
  });

  describe('Executive Context Generation', () => {
    beforeEach(async () => {
      await ragSystem.initialize('test-user-id');
    });

    it('should generate executive context for strategic queries', async () => {
      const context = await ragSystem.getExecutiveContext(testQueries.executive[0]);
      
      expectValidRAGContext(context);
      expect(context).toContain('EXECUTIVE CONTEXT');
      expect(context).toContain('USER INTELLIGENCE');
      expect(context).toContain(mockUserContext.profile.name);
      expect(context).toContain(mockUserContext.profile.role);
    });

    it('should include business context in executive responses', async () => {
      const context = await ragSystem.getExecutiveContext('What should be our Q1 priorities?');
      
      expect(context).toContain('BUSINESS CONTEXT');
      expect(context).toContain(mockUserContext.business_context.company_name);
      expect(context).toContain(mockUserContext.business_context.industry);
      expect(context).toContain(mockUserContext.business_context.growth_stage);
    });

    it('should include personalization insights', async () => {
      const context = await ragSystem.getExecutiveContext('How is the company performing?');
      
      expect(context).toContain('PERSONALIZATION INSIGHTS');
      expect(context).toContain(mockUserContext.profile.communication_style);
      expect(context).toContain(mockUserContext.profile.experience_level);
    });

    it('should handle executive context generation within performance threshold', async () => {
      const executionTime = await measureExecutionTime(async () => {
        await ragSystem.getExecutiveContext(testQueries.executive[0]);
      });

      expectPerformanceThreshold(executionTime, 500); // 500ms threshold
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
      const context = await ragSystem.getDepartmentContext('sales', testQueries.sales[0]);
      
      expectValidRAGContext(context);
      expect(context).toContain('SALES');
      expect(context).toContain('DEPARTMENT CONTEXT');
      expect(context).toContain('PERFORMANCE');
    });

    it('should generate marketing department context', async () => {
      const context = await ragSystem.getDepartmentContext('marketing', testQueries.marketing[0]);
      
      expectValidRAGContext(context);
      expect(context).toContain('MARKETING');
      expect(context).toContain('DEPARTMENT CONTEXT');
    });

    it('should generate finance department context', async () => {
      const context = await ragSystem.getDepartmentContext('finance', testQueries.finance[0]);
      
      expectValidRAGContext(context);
      expect(context).toContain('FINANCE');
      expect(context).toContain('DEPARTMENT CONTEXT');
    });

    it('should generate operations department context', async () => {
      const context = await ragSystem.getDepartmentContext('operations', testQueries.operations[0]);
      
      expectValidRAGContext(context);
      expect(context).toContain('OPERATIONS');
      expect(context).toContain('DEPARTMENT CONTEXT');
    });

    it('should include user profile in department context', async () => {
      const context = await ragSystem.getDepartmentContext('sales', 'Show me sales performance');
      
      expect(context).toContain('USER PROFILE');
      expect(context).toContain(mockUserContext.profile.name);
      expect(context).toContain(mockUserContext.profile.role);
    });

    it('should handle invalid department gracefully', async () => {
      const context = await ragSystem.getDepartmentContext('invalid-department', 'test query');
      
      // Should not throw, should return basic context
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

  describe('Data Processing', () => {
    beforeEach(async () => {
      await ragSystem.initialize('test-user-id');
    });

    it('should process user context data correctly', async () => {
      // Test internal data processing by checking context output
      const context = await ragSystem.getExecutiveContext('test query');
      
      // Verify user data is processed and included
      expect(context).toContain(mockUserContext.profile.name);
      expect(context).toContain(mockUserContext.business_context.company_name);
      expect(context).toContain(mockUserContext.success_criteria.primary_success_metric);
    });

    it('should handle missing user context gracefully', async () => {
      // Mock empty user context
      const { supabase } = await import('../../src/lib/supabase');
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null })
      });

      const newRAG = new ContextualRAG();
      await newRAG.initialize('test-user-id');
      
      const context = await newRAG.getExecutiveContext('test query');
      expect(context).toBeDefined();
      expect(context.length).toBeGreaterThan(0);
    });

    it('should process department data correctly', async () => {
      const context = await ragSystem.getDepartmentContext('sales', 'Show me sales data');
      
      // Should include processed department data
      expect(context).toBeDefined();
      expect(context).toContain('PERFORMANCE');
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
      
      // Test with null/undefined queries
      await expect(ragSystem.getExecutiveContext('')).resolves.not.toThrow();
      await expect(ragSystem.getDepartmentContext('sales', '')).resolves.not.toThrow();
    });

    it('should handle memory/resource constraints', async () => {
      await ragSystem.initialize('test-user-id');
      
      // Test with very large query
      const largeQuery = 'test '.repeat(10000);
      
      await expect(ragSystem.getExecutiveContext(largeQuery)).resolves.not.toThrow();
    });
  });

  describe('Performance Tests', () => {
    beforeEach(async () => {
      await ragSystem.initialize('test-user-id');
    });

    it('should handle concurrent context generation', async () => {
      const promises = [
        ragSystem.getExecutiveContext(testQueries.executive[0]),
        ragSystem.getDepartmentContext('sales', testQueries.sales[0]),
        ragSystem.getDepartmentContext('marketing', testQueries.marketing[0]),
        ragSystem.getDepartmentContext('finance', testQueries.finance[0])
      ];

      const results = await Promise.all(promises);
      
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.length).toBeGreaterThan(0);
      });
    });

    it('should maintain performance under load', async () => {
      const iterations = 10;
      const promises = [];

      for (let i = 0; i < iterations; i++) {
        promises.push(ragSystem.getExecutiveContext(`Test query ${i}`));
      }

      const startTime = performance.now();
      await Promise.all(promises);
      const endTime = performance.now();

      const averageTime = (endTime - startTime) / iterations;
      expect(averageTime).toBeLessThan(100); // Average should be under 100ms
    });
  });
}); 