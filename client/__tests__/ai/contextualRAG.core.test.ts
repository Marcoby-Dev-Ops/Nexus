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
      ilike: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      upsert: jest.fn().mockResolvedValue({ error: null }),
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

describe('ContextualRAG Core Functionality', () => {
  let ragSystem: ContextualRAG;

  beforeEach(() => {
    ragSystem = new ContextualRAG();
    jest.clearAllMocks();
  });

  describe('Document Search', () => {
    it('should search relevant documents successfully', async () => {
      const query = {
        query: 'test query',
        context: {
          userId: 'test-user-id',
          companyId: 'test-company-id',
          sessionId: 'test-session-id'
        },
        maxResults: 5,
        threshold: 0.7
      };

      const result = await ragSystem.searchRelevantDocuments(query);
      
      expect(result).toBeDefined();
      expect(result.documents).toBeDefined();
      expect(result.query).toBe(query.query);
      expect(result.context).toBe(query.context);
      expect(result.totalResults).toBeGreaterThanOrEqual(0);
      expect(result.processingTime).toBeGreaterThan(0);
    });

    it('should handle search with empty results gracefully', async () => {
      const query = {
        query: 'nonexistent query',
        context: {
          userId: 'test-user-id'
        }
      };

      const result = await ragSystem.searchRelevantDocuments(query);
      
      expect(result.documents).toEqual([]);
      expect(result.totalResults).toBe(0);
    });

    it('should handle search errors gracefully', async () => {
      // Mock database error
      const { supabase } = await import('../../src/lib/supabase');
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockRejectedValue(new Error('Database error'))
      });

      const query = {
        query: 'test query',
        context: { userId: 'test-user-id' }
      };

      const result = await ragSystem.searchRelevantDocuments(query);
      
      expect(result.documents).toEqual([]);
      expect(result.totalResults).toBe(0);
    });
  });

  describe('Contextual Response Generation', () => {
    it('should generate contextual response with relevant documents', async () => {
      const context = {
        userId: 'test-user-id',
        companyId: 'test-company-id',
        currentTopic: 'business strategy'
      };

      const response = await ragSystem.generateContextualResponse('What are our priorities?', context);
      
      expect(response).toBeDefined();
      expect(typeof response).toBe('string');
      expect(response.length).toBeGreaterThan(0);
    });

    it('should handle response generation with no relevant documents', async () => {
      const context = {
        userId: 'test-user-id'
      };

      const response = await ragSystem.generateContextualResponse('completely unrelated query', context);
      
      expect(response).toBeDefined();
      expect(response).toContain("don't have enough relevant context");
    });

    it('should handle response generation errors gracefully', async () => {
      // Mock error in searchRelevantDocuments
      const { supabase } = await import('../../src/lib/supabase');
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockRejectedValue(new Error('Search error'))
      });

      const context = {
        userId: 'test-user-id'
      };

      const response = await ragSystem.generateContextualResponse('test query', context);
      
      expect(response).toBeDefined();
      expect(response).toContain("having trouble accessing");
    });
  });

  describe('User Context Updates', () => {
    it('should update user context successfully', async () => {
      const userId = 'test-user-id';
      const contextUpdate = {
        currentTopic: 'sales performance',
        sessionId: 'new-session-id'
      };

      await expect(ragSystem.updateUserContext(userId, contextUpdate)).resolves.not.toThrow();
    });

    it('should handle context update errors gracefully', async () => {
      // Mock database error
      const { supabase } = await import('../../src/lib/supabase');
      (supabase.from as jest.Mock).mockReturnValue({
        upsert: jest.fn().mockResolvedValue({ error: new Error('Update failed') })
      });

      const userId = 'test-user-id';
      const contextUpdate = {
        currentTopic: 'test topic'
      };

      await expect(ragSystem.updateUserContext(userId, contextUpdate)).resolves.not.toThrow();
    });
  });

  describe('Performance Tests', () => {
    it('should handle concurrent document searches', async () => {
      const queries = [
        {
          query: 'Query 1',
          context: { userId: 'test-user-id' }
        },
        {
          query: 'Query 2', 
          context: { userId: 'test-user-id' }
        },
        {
          query: 'Query 3',
          context: { userId: 'test-user-id' }
        }
      ];

      const promises = queries.map(query => ragSystem.searchRelevantDocuments(query));
      const results = await Promise.all(promises);
      
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.documents).toBeDefined();
        expect(result.processingTime).toBeGreaterThan(0);
      });
    });

    it('should maintain performance under load', async () => {
      const iterations = 5;
      const promises: Promise<any>[] = [];

      for (let i = 0; i < iterations; i++) {
        promises.push(ragSystem.searchRelevantDocuments({
          query: `Test query ${i}`,
          context: { userId: 'test-user-id' }
        }));
      }

      const startTime = performance.now();
      await Promise.all(promises);
      const endTime = performance.now();

      const averageTime = (endTime - startTime) / iterations;
      expect(averageTime).toBeLessThan(1000); // Average should be reasonable
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // Mock database error
      const { supabase } = await import('../../src/lib/supabase');
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockRejectedValue(new Error('Database connection failed'))
      });

      const query = {
        query: 'test query',
        context: { userId: 'test-user-id' }
      };

      const result = await ragSystem.searchRelevantDocuments(query);
      
      expect(result.documents).toEqual([]);
      expect(result.totalResults).toBe(0);
    });

    it('should handle invalid query parameters', async () => {
      const query = {
        query: '',
        context: { userId: 'test-user-id' }
      };

      const result = await ragSystem.searchRelevantDocuments(query);
      
      expect(result).toBeDefined();
      expect(result.documents).toBeDefined();
    });

    it('should handle memory constraints with large queries', async () => {
      const largeQuery = 'test '.repeat(1000);
      
      const result = await ragSystem.searchRelevantDocuments({
        query: largeQuery,
        context: { userId: 'test-user-id' }
      });
      
      expect(result).toBeDefined();
      expect(result.documents).toBeDefined();
    });
  });

  describe('Document Ranking', () => {
    it('should rank documents by relevance', async () => {
      const query = {
        query: 'business strategy',
        context: { 
          userId: 'test-user-id',
          currentTopic: 'strategy'
        }
      };

      const result = await ragSystem.searchRelevantDocuments(query);
      
      if (result.documents.length > 1) {
        // Check that documents are ranked by relevance score
        const scores = result.documents.map(doc => doc.metadata.relevance_score || 0);
        for (let i = 1; i < scores.length; i++) {
          expect(scores[i - 1]).toBeGreaterThanOrEqual(scores[i]);
        }
      }
    });

    it('should apply threshold filtering correctly', async () => {
      const query = {
        query: 'test query',
        context: { userId: 'test-user-id' },
        threshold: 0.8 // High threshold
      };

      const result = await ragSystem.searchRelevantDocuments(query);
      
      result.documents.forEach(doc => {
        expect(doc.metadata.relevance_score || 0).toBeGreaterThanOrEqual(0.8);
      });
    });
  });
}); 