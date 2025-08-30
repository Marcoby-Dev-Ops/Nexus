import { enhancedChatService } from '../enhancedChatService';
import { chatContextApi } from '@/lib/api/chatContextApi';
import { getAgent } from '../agentRegistry';

// Mock the API client
jest.mock('@/lib/api-client', () => ({
  callEdgeFunction: jest.fn(),
  selectData: jest.fn(),
  selectOne: jest.fn()
}));

// Mock the contextual RAG
jest.mock('../contextualRAG', () => ({
  contextualRAG: {
    searchRelevantDocuments: jest.fn(),
    updateUserContext: jest.fn()
  }
}));

describe('EnhancedChatService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendMessageWithContext', () => {
    it('should integrate user, company, and building blocks context', async () => {
      // Mock user context data
      const mockUserContext = {
        userId: 'test-user-id',
        profile: {
          id: 'profile-id',
          email: 'test@example.com',
          first_name: 'Test',
          last_name: 'User',
          company_id: 'test-company-id',
          role: 'founder',
          experience_level: 'intermediate'
        },
        company: {
          id: 'test-company-id',
          name: 'Test Company',
          description: 'A test company',
          industry: 'Technology',
          size: 'small',
          analytics: {
            revenue: 100000,
            employees: 5,
            customers: 50
          },
          health: {
            score: 75,
            status: 'healthy',
            insights: ['Strong revenue growth', 'Good customer retention']
          }
        },
        buildingBlocks: [
          {
            id: 'identity',
            name: 'Identity',
            status: 'complete',
            category: 'core',
            progress: 100
          },
          {
            id: 'revenue',
            name: 'Revenue',
            status: 'in_progress',
            category: 'core',
            progress: 60
          },
          {
            id: 'cash',
            name: 'Cash',
            status: 'not_started',
            category: 'core',
            progress: 0
          }
        ],
        recentActivity: [
          {
            id: 'activity-1',
            type: 'chat_message',
            description: 'Previous chat message',
            timestamp: new Date().toISOString()
          }
        ]
      };

      // Mock the chat context API
      jest.spyOn(chatContextApi, 'getUserContext').mockResolvedValue({
        success: true,
        data: mockUserContext
      });

      // Mock the edge function response
      const { callEdgeFunction } = require('@/lib/api-client');
      callEdgeFunction.mockResolvedValue({
        success: true,
        data: {
          response: 'Hello! I can see you have a technology company with $100K revenue and 5 employees. Your Identity building block is complete, Revenue is 60% done, and Cash hasn\'t been started yet.'
        }
      });

      // Mock RAG context
      const { contextualRAG } = require('../contextualRAG');
      contextualRAG.searchRelevantDocuments.mockResolvedValue({
        documents: [],
        query: 'test query',
        context: {},
        totalResults: 0,
        processingTime: 100
      });

      const request = {
        message: 'Tell me about my company',
        conversationId: 'test-conversation',
        agent: getAgent('executive-assistant'),
        context: {
          userId: 'test-user-id',
          companyId: 'test-company-id',
          sessionId: 'test-session',
          currentTopic: 'company discussion',
          recentInteractions: ['Previous message'],
          userPreferences: {}
        }
      };

      const result = await enhancedChatService.sendMessageWithContext(request);

      // Verify the result
      expect(result.success).toBe(true);
      expect(result.response).toContain('technology company');
      expect(result.response).toContain('$100K revenue');
      expect(result.response).toContain('5 employees');
      expect(result.response).toContain('Identity building block is complete');
      expect(result.response).toContain('Revenue is 60% done');
      expect(result.response).toContain('Cash hasn\'t been started');

      // Verify metadata
      expect(result.metadata.companyDataUsed).toBe(true);
      expect(result.metadata.buildingBlocksUsed).toBe(true);
      expect(result.metadata.contextUsed).toBe(true);

      // Verify API calls were made
      expect(chatContextApi.getUserContext).toHaveBeenCalledWith('test-user-id');
      expect(callEdgeFunction).toHaveBeenCalledWith('chat', expect.objectContaining({
        message: 'Tell me about my company',
        conversationId: 'test-conversation',
        systemPrompt: expect.stringContaining('COMPANY: Test Company'),
        systemPrompt: expect.stringContaining('BUILDING BLOCKS STATUS:'),
        systemPrompt: expect.stringContaining('✅ Identity: complete'),
        systemPrompt: expect.stringContaining('🔄 Revenue: in progress'),
        systemPrompt: expect.stringContaining('⏳ Cash: not started')
      }));
    });

    it('should handle missing company data gracefully', async () => {
      // Mock user context without company data
      const mockUserContext = {
        userId: 'test-user-id',
        profile: {
          id: 'profile-id',
          email: 'test@example.com',
          first_name: 'Test',
          last_name: 'User'
        },
        company: undefined,
        buildingBlocks: [
          {
            id: 'identity',
            name: 'Identity',
            status: 'not_started',
            category: 'core',
            progress: 0
          }
        ],
        recentActivity: []
      };

      jest.spyOn(chatContextApi, 'getUserContext').mockResolvedValue({
        success: true,
        data: mockUserContext
      });

      const { callEdgeFunction } = require('@/lib/api-client');
      callEdgeFunction.mockResolvedValue({
        success: true,
        data: {
          response: 'I can help you with your business. I see you haven\'t started working on your Identity building block yet.'
        }
      });

      const { contextualRAG } = require('../contextualRAG');
      contextualRAG.searchRelevantDocuments.mockResolvedValue({
        documents: [],
        query: 'test query',
        context: {},
        totalResults: 0,
        processingTime: 100
      });

      const request = {
        message: 'What should I work on?',
        conversationId: 'test-conversation',
        agent: getAgent('executive-assistant'),
        context: {
          userId: 'test-user-id',
          sessionId: 'test-session',
          currentTopic: 'business planning',
          recentInteractions: [],
          userPreferences: {}
        }
      };

      const result = await enhancedChatService.sendMessageWithContext(request);

      expect(result.success).toBe(true);
      expect(result.metadata.companyDataUsed).toBe(false);
      expect(result.metadata.buildingBlocksUsed).toBe(true);
    });
  });
});
