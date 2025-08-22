import { AIService } from '../../src/core/services/AIService';
import { mockSupabaseClient } from '../utils/ragTestUtils';

// Mock the AIService dependencies
jest.mock('../../src/core/services/AIService', () => {
  const originalModule = jest.requireActual('../../src/core/services/AIService');
  return {
    ...originalModule,
    AIService: jest.fn().mockImplementation(() => ({
      ...originalModule.AIService.prototype,
      supabase: mockSupabaseClient,
      logMethodCall: jest.fn(),
      logError: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      generateEmbedding: jest.fn(),
      embedCompanyProfile: jest.fn(),
      processEmbeddingRequest: jest.fn()
    }))
  };
});

describe('AIService', () => {
  let aiService: AIService;

  beforeEach(() => {
    jest.clearAllMocks();
    aiService = new AIService();
  });

  describe('generateEmbedding', () => {
    it('should generate embedding successfully', async () => {
      const mockOperation = {
        id: 'test-operation-id',
        user_id: 'system',
        operation_type: 'generation' as const,
        model: 'text-embedding-3-small',
        prompt: 'Generate embedding for: Test text',
        input_data: { text: 'Test text', model: 'text-embedding-3-small' },
        status: 'pending' as const,
        created_at: new Date().toISOString(),
      };

      // Mock the create method
      (aiService.create as jest.Mock).mockResolvedValue({
        success: true,
        data: mockOperation
      });

      // Mock the update method for processing
      (aiService.update as jest.Mock).mockResolvedValue({
        success: true,
        data: { ...mockOperation, status: 'completed' }
      });

      const result = await aiService.generateEmbedding('Test text');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(aiService.create).toHaveBeenCalledWith(expect.objectContaining({
        user_id: 'system',
        operation_type: 'generation',
        model: 'text-embedding-3-small'
      }));
    });

    it('should handle embedding generation failure', async () => {
      (aiService.create as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Failed to create operation'
      });

      const result = await aiService.generateEmbedding('Test text');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to create embedding operation');
    });

    it('should handle exceptions during embedding generation', async () => {
      (aiService.create as jest.Mock).mockRejectedValue(new Error('Database error'));

      const result = await aiService.generateEmbedding('Test text');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
    });

    it('should use custom model when provided', async () => {
      const mockOperation = {
        id: 'test-operation-id',
        user_id: 'system',
        operation_type: 'generation' as const,
        model: 'text-embedding-3-large',
        prompt: 'Generate embedding for: Test text',
        input_data: { text: 'Test text', model: 'text-embedding-3-large' },
        status: 'pending' as const,
        created_at: new Date().toISOString(),
      };

      (aiService.create as jest.Mock).mockResolvedValue({
        success: true,
        data: mockOperation
      });

      (aiService.update as jest.Mock).mockResolvedValue({
        success: true,
        data: { ...mockOperation, status: 'completed' }
      });

      await aiService.generateEmbedding('Test text', 'text-embedding-3-large');

      expect(aiService.create).toHaveBeenCalledWith(expect.objectContaining({
        model: 'text-embedding-3-large'
      }));
    });
  });

  describe('embedCompanyProfile', () => {
    const mockProfileData = {
      tagline: 'Innovative solutions for tomorrow',
      motto: 'Excellence in everything',
      mission_statement: 'To provide cutting-edge technology solutions',
      vision_statement: 'Leading the digital transformation',
      about_md: 'We are a forward-thinking company...'
    };

    it('should embed company profile successfully', async () => {
      const mockEmbedding = new Array(1536).fill(0.1);
      
      // Mock generateEmbedding
      (aiService.generateEmbedding as jest.Mock).mockResolvedValue({
        success: true,
        data: mockEmbedding
      });

      // Mock database update
      mockSupabaseClient.from().update.mockResolvedValue({
        data: { company_id: 'test-company-id' },
        error: null
      });

      const result = await aiService.embedCompanyProfile('test-company-id', mockProfileData);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.profile_id).toBe('test-company-id');
      expect(aiService.generateEmbedding).toHaveBeenCalledWith(
        expect.stringContaining('Innovative solutions for tomorrow'),
        'text-embedding-3-small'
      );
    });

    it('should handle empty profile data', async () => {
      const result = await aiService.embedCompanyProfile('test-company-id', {});

      expect(result.success).toBe(false);
      expect(result.error).toBe('No content to embed');
    });

    it('should handle embedding generation failure', async () => {
      (aiService.generateEmbedding as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Embedding generation failed'
      });

      const result = await aiService.embedCompanyProfile('test-company-id', mockProfileData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Embedding generation failed');
    });

    it('should handle database update failure', async () => {
      (aiService.generateEmbedding as jest.Mock).mockResolvedValue({
        success: true,
        data: new Array(1536).fill(0.1)
      });

      mockSupabaseClient.from().update.mockResolvedValue({
        data: null,
        error: { message: 'Database update failed' }
      });

      const result = await aiService.embedCompanyProfile('test-company-id', mockProfileData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database update failed');
    });

    it('should combine profile text correctly', async () => {
      const mockEmbedding = new Array(1536).fill(0.1);
      
      (aiService.generateEmbedding as jest.Mock).mockResolvedValue({
        success: true,
        data: mockEmbedding
      });

      mockSupabaseClient.from().update.mockResolvedValue({
        data: { company_id: 'test-company-id' },
        error: null
      });

      await aiService.embedCompanyProfile('test-company-id', mockProfileData);

      const expectedText = [
        'Innovative solutions for tomorrow',
        'Excellence in everything',
        'To provide cutting-edge technology solutions',
        'Leading the digital transformation',
        'We are a forward-thinking company...'
      ].join('\n\n');

      expect(aiService.generateEmbedding).toHaveBeenCalledWith(expectedText, 'text-embedding-3-small');
    });

    it('should filter out empty profile fields', async () => {
      const partialProfileData = {
        tagline: 'Innovative solutions',
        motto: '',
        mission_statement: 'To provide solutions',
        vision_statement: null,
        about_md: undefined
      };

      const mockEmbedding = new Array(1536).fill(0.1);
      
      (aiService.generateEmbedding as jest.Mock).mockResolvedValue({
        success: true,
        data: mockEmbedding
      });

      mockSupabaseClient.from().update.mockResolvedValue({
        data: { company_id: 'test-company-id' },
        error: null
      });

      await aiService.embedCompanyProfile('test-company-id', partialProfileData);

      const expectedText = [
        'Innovative solutions',
        'To provide solutions'
      ].join('\n\n');

      expect(aiService.generateEmbedding).toHaveBeenCalledWith(expectedText, 'text-embedding-3-small');
    });
  });

  describe('processEmbeddingRequest', () => {
    it('should process embedding request and update operation', async () => {
      const mockOperation = {
        id: 'test-operation-id',
        user_id: 'system',
        operation_type: 'generation' as const,
        model: 'text-embedding-3-small',
        prompt: 'Generate embedding for: Test text',
        input_data: { text: 'Test text', model: 'text-embedding-3-small' },
        status: 'pending' as const,
        created_at: new Date().toISOString(),
      };

      (aiService.update as jest.Mock).mockResolvedValue({
        success: true,
        data: { ...mockOperation, status: 'completed' }
      });

      const result = await (aiService as any).processEmbeddingRequest(mockOperation);

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(1536);
      expect(aiService.update).toHaveBeenCalledWith(mockOperation.id, expect.objectContaining({
        status: 'completed',
        tokens_used: 100,
        cost: 0.0001,
        processing_time: 0.5
      }));
    });

    it('should generate consistent embedding dimensions', async () => {
      const mockOperation = {
        id: 'test-operation-id',
        user_id: 'system',
        operation_type: 'generation' as const,
        model: 'text-embedding-3-small',
        prompt: 'Generate embedding for: Test text',
        input_data: { text: 'Test text', model: 'text-embedding-3-small' },
        status: 'pending' as const,
        created_at: new Date().toISOString(),
      };

      const result = await (aiService as any).processEmbeddingRequest(mockOperation);

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(1536); // OpenAI text-embedding-3-small dimension
      
      // Check that all values are numbers between -0.5 and 0.5 (simulated embedding range)
      result.forEach(value => {
        expect(typeof value).toBe('number');
        expect(value).toBeGreaterThanOrEqual(-0.5);
        expect(value).toBeLessThanOrEqual(0.5);
      });
    });
  });

  describe('Error handling and logging', () => {
    it('should log method calls correctly', async () => {
      const mockOperation = {
        id: 'test-operation-id',
        user_id: 'system',
        operation_type: 'generation' as const,
        model: 'text-embedding-3-small',
        prompt: 'Generate embedding for: Test text',
        input_data: { text: 'Test text', model: 'text-embedding-3-small' },
        status: 'pending' as const,
        created_at: new Date().toISOString(),
      };

      (aiService.create as jest.Mock).mockResolvedValue({
        success: true,
        data: mockOperation
      });

      (aiService.update as jest.Mock).mockResolvedValue({
        success: true,
        data: { ...mockOperation, status: 'completed' }
      });

      await aiService.generateEmbedding('Test text');

      expect(aiService.logMethodCall).toHaveBeenCalledWith('generateEmbedding', {
        text: 'Test text',
        model: 'text-embedding-3-small'
      });
    });

    it('should log errors correctly', async () => {
      const error = new Error('Test error');
      (aiService.create as jest.Mock).mockRejectedValue(error);

      await aiService.generateEmbedding('Test text');

      expect(aiService.logError).toHaveBeenCalledWith('generateEmbedding', error);
    });

    it('should truncate long text in logs', async () => {
      const longText = 'A'.repeat(200);
      const mockOperation = {
        id: 'test-operation-id',
        user_id: 'system',
        operation_type: 'generation' as const,
        model: 'text-embedding-3-small',
        prompt: `Generate embedding for: ${longText.substring(0, 200)}`,
        input_data: { text: longText, model: 'text-embedding-3-small' },
        status: 'pending' as const,
        created_at: new Date().toISOString(),
      };

      (aiService.create as jest.Mock).mockResolvedValue({
        success: true,
        data: mockOperation
      });

      (aiService.update as jest.Mock).mockResolvedValue({
        success: true,
        data: { ...mockOperation, status: 'completed' }
      });

      await aiService.generateEmbedding(longText);

      expect(aiService.logMethodCall).toHaveBeenCalledWith('generateEmbedding', {
        text: longText.substring(0, 100),
        model: 'text-embedding-3-small'
      });
    });
  });

  describe('Integration with existing AIService methods', () => {
    it('should work with existing service methods', async () => {
      // Test that the new embedding methods integrate well with existing functionality
      const mockOperation = {
        id: 'test-operation-id',
        user_id: 'system',
        operation_type: 'generation' as const,
        model: 'text-embedding-3-small',
        prompt: 'Generate embedding for: Test text',
        input_data: { text: 'Test text', model: 'text-embedding-3-small' },
        status: 'pending' as const,
        created_at: new Date().toISOString(),
      };

      (aiService.create as jest.Mock).mockResolvedValue({
        success: true,
        data: mockOperation
      });

      (aiService.update as jest.Mock).mockResolvedValue({
        success: true,
        data: { ...mockOperation, status: 'completed' }
      });

      // Test that the service can handle multiple operations
      const result1 = await aiService.generateEmbedding('Text 1');
      const result2 = await aiService.generateEmbedding('Text 2');

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(aiService.create).toHaveBeenCalledTimes(2);
    });
  });
}); 