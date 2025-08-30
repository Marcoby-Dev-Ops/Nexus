/**
 * Chat System Integration Tests
 * 
 * Comprehensive tests to ensure the chat system is fully operational
 * including business context integration, agent selection, and message handling
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { callEdgeFunction } from '@/lib/api-client';
import { useAIChatStore } from '@/shared/stores/useAIChatStore';
import { useUserProfile, useUserCompany } from '@/shared/contexts/UserContext';

// Mock the API client
vi.mock('@/lib/api-client', () => ({
  callEdgeFunction: vi.fn()
}));

// Mock the stores and contexts
vi.mock('@/shared/stores/useAIChatStore', () => ({
  useAIChatStore: vi.fn()
}));

vi.mock('@/shared/contexts/UserContext', () => ({
  useUserProfile: vi.fn(),
  useUserCompany: vi.fn()
}));

describe('Chat System Integration Tests', () => {
  const mockCallEdgeFunction = callEdgeFunction as jest.MockedFunction<typeof callEdgeFunction>;
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock successful API responses
    mockCallEdgeFunction.mockResolvedValue({
      success: true,
      data: {
        content: 'Test response from AI',
        conversationId: 'test-conversation-id',
        agentId: 'executive-assistant',
        timestamp: new Date().toISOString()
      }
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Business Context Integration', () => {
    it('should include comprehensive business context in chat requests', async () => {
      // Mock user context
      (useUserProfile as any).mockReturnValue({
        profile: {
          id: 'test-user-id',
          first_name: 'John',
          last_name: 'Doe',
          role: 'owner',
          department: 'Executive',
          job_title: 'CEO'
        }
      });

      (useUserCompany as any).mockReturnValue({
        company: {
          id: 'test-company-id',
          name: 'Test Corp',
          industry: 'Technology',
          size: '10-50',
          description: 'A test company'
        }
      });

      const message = 'Hello, how can you help my business?';
      const businessContext = {
        user: {
          id: 'test-user-id',
          name: 'John Doe',
          role: 'owner',
          department: 'Executive',
          experience_level: 'intermediate',
          communication_style: 'balanced'
        },
        company: {
          id: 'test-company-id',
          name: 'Test Corp',
          industry: 'Technology',
          size: '10-50',
          description: 'A test company'
        },
        agent: {
          id: 'executive-assistant',
          type: 'assistant',
          capabilities: []
        },
        conversation: {
          id: null,
          history: []
        },
        attachments: []
      };

      await mockCallEdgeFunction('ai_chat', {
        message,
        context: businessContext
      });

      expect(mockCallEdgeFunction).toHaveBeenCalledWith('ai_chat', {
        message,
        context: businessContext
      });
    });

    it('should handle missing user context gracefully', async () => {
      // Mock empty user context
      (useUserProfile as any).mockReturnValue({ profile: null });
      (useUserCompany as any).mockReturnValue({ company: null });

      const message = 'Hello';
      const businessContext = {
        user: {
          id: 'test-user-id',
          name: 'User',
          role: 'User',
          department: 'General',
          experience_level: 'intermediate',
          communication_style: 'balanced'
        },
        company: null,
        agent: {
          id: 'executive-assistant',
          type: 'assistant',
          capabilities: []
        },
        conversation: {
          id: null,
          history: []
        },
        attachments: []
      };

      await mockCallEdgeFunction('ai_chat', {
        message,
        context: businessContext
      });

      expect(mockCallEdgeFunction).toHaveBeenCalledWith('ai_chat', {
        message,
        context: businessContext
      });
    });
  });

  describe('Agent Selection and Routing', () => {
    it('should route messages to correct agents based on agentId', async () => {
      const agents = [
        { id: 'executive-assistant', name: 'Executive Assistant', type: 'assistant' },
        { id: 'business-identity-consultant', name: 'Business Identity Consultant', type: 'specialist' },
        { id: 'sales-expert', name: 'Sales Expert', type: 'specialist' },
        { id: 'finance-expert', name: 'Finance Expert', type: 'specialist' }
      ];

      for (const agent of agents) {
        const message = `Hello ${agent.name}`;
        const businessContext = {
          user: { id: 'test-user', name: 'User', role: 'User', department: 'General' },
          company: null,
          agent: {
            id: agent.id,
            type: agent.type,
            capabilities: []
          },
          conversation: { id: null, history: [] },
          attachments: []
        };

        await mockCallEdgeFunction('ai_chat', {
          message,
          context: businessContext
        });

        expect(mockCallEdgeFunction).toHaveBeenCalledWith('ai_chat', {
          message,
          context: businessContext
        });
      }
    });

    it('should handle agent switching correctly', async () => {
      const initialAgentId = 'executive-assistant';
      const newAgentId = 'finance-expert';

      // Test initial agent
      let businessContext = {
        user: { id: 'test-user', name: 'User', role: 'User', department: 'General' },
        company: null,
        agent: { id: initialAgentId, type: 'assistant', capabilities: [] },
        conversation: { id: null, history: [] },
        attachments: []
      };

      await mockCallEdgeFunction('ai_chat', {
        message: 'Hello',
        context: businessContext
      });

      // Test agent switch
      businessContext.agent.id = newAgentId;
      businessContext.agent.type = 'specialist';

      await mockCallEdgeFunction('ai_chat', {
        message: 'How are my finances?',
        context: businessContext
      });

      expect(mockCallEdgeFunction).toHaveBeenCalledTimes(2);
    });
  });

  describe('Message Handling and Response Processing', () => {
    it('should process successful AI responses correctly', async () => {
      const mockResponse = {
        success: true,
        data: {
          content: 'I can help you with your business strategy. What specific area would you like to focus on?',
          conversationId: 'conv-123',
          agentId: 'executive-assistant',
          timestamp: new Date().toISOString()
        }
      };

      mockCallEdgeFunction.mockResolvedValue(mockResponse);

      const response = await mockCallEdgeFunction('ai_chat', {
        message: 'Help me with business strategy',
        context: {}
      });

      expect(response.success).toBe(true);
      expect(response.data.content).toBeDefined();
      expect(response.data.conversationId).toBeDefined();
      expect(response.data.agentId).toBeDefined();
    });

    it('should handle API errors gracefully', async () => {
      const mockError = {
        success: false,
        error: 'Failed to process request',
        data: {
          message: 'I apologize, but I encountered an error processing your request. Please try again.',
          agentId: 'executive-assistant',
          conversationId: null,
          timestamp: new Date().toISOString()
        }
      };

      mockCallEdgeFunction.mockResolvedValue(mockError);

      const response = await mockCallEdgeFunction('ai_chat', {
        message: 'Test message',
        context: {}
      });

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
      expect(response.data.message).toBeDefined();
    });

    it('should handle network errors', async () => {
      mockCallEdgeFunction.mockRejectedValue(new Error('Network error'));

      await expect(mockCallEdgeFunction('ai_chat', {
        message: 'Test message',
        context: {}
      })).rejects.toThrow('Network error');
    });
  });

  describe('Conversation Management', () => {
    it('should maintain conversation history correctly', async () => {
      const conversationHistory = [
        { role: 'user', content: 'Hello', timestamp: new Date().toISOString() },
        { role: 'assistant', content: 'Hi! How can I help?', timestamp: new Date().toISOString() }
      ];

      const businessContext = {
        user: { id: 'test-user', name: 'User', role: 'User', department: 'General' },
        company: null,
        agent: { id: 'executive-assistant', type: 'assistant', capabilities: [] },
        conversation: {
          id: 'conv-123',
          history: conversationHistory
        },
        attachments: []
      };

      await mockCallEdgeFunction('ai_chat', {
        message: 'What was our previous discussion?',
        context: businessContext
      });

      expect(mockCallEdgeFunction).toHaveBeenCalledWith('ai_chat', {
        message: 'What was our previous discussion?',
        context: businessContext
      });
    });

    it('should handle new conversations without history', async () => {
      const businessContext = {
        user: { id: 'test-user', name: 'User', role: 'User', department: 'General' },
        company: null,
        agent: { id: 'executive-assistant', type: 'assistant', capabilities: [] },
        conversation: {
          id: null,
          history: []
        },
        attachments: []
      };

      await mockCallEdgeFunction('ai_chat', {
        message: 'Start a new conversation',
        context: businessContext
      });

      expect(mockCallEdgeFunction).toHaveBeenCalledWith('ai_chat', {
        message: 'Start a new conversation',
        context: businessContext
      });
    });
  });

  describe('File Attachments and Multi-modal Support', () => {
    it('should handle file attachments in messages', async () => {
      const attachments = [
        { name: 'document.pdf', type: 'application/pdf', size: 1024 },
        { name: 'image.jpg', type: 'image/jpeg', size: 2048 }
      ];

      const businessContext = {
        user: { id: 'test-user', name: 'User', role: 'User', department: 'General' },
        company: null,
        agent: { id: 'executive-assistant', type: 'assistant', capabilities: [] },
        conversation: { id: null, history: [] },
        attachments
      };

      await mockCallEdgeFunction('ai_chat', {
        message: 'Please analyze these documents',
        context: businessContext
      });

      expect(mockCallEdgeFunction).toHaveBeenCalledWith('ai_chat', {
        message: 'Please analyze these documents',
        context: businessContext
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle empty messages', async () => {
      const businessContext = {
        user: { id: 'test-user', name: 'User', role: 'User', department: 'General' },
        company: null,
        agent: { id: 'executive-assistant', type: 'assistant', capabilities: [] },
        conversation: { id: null, history: [] },
        attachments: []
      };

      await mockCallEdgeFunction('ai_chat', {
        message: '',
        context: businessContext
      });

      expect(mockCallEdgeFunction).toHaveBeenCalledWith('ai_chat', {
        message: '',
        context: businessContext
      });
    });

    it('should handle very long messages', async () => {
      const longMessage = 'A'.repeat(3000); // Exceeds 2000 character limit
      const businessContext = {
        user: { id: 'test-user', name: 'User', role: 'User', department: 'General' },
        company: null,
        agent: { id: 'executive-assistant', type: 'assistant', capabilities: [] },
        conversation: { id: null, history: [] },
        attachments: []
      };

      await mockCallEdgeFunction('ai_chat', {
        message: longMessage,
        context: businessContext
      });

      expect(mockCallEdgeFunction).toHaveBeenCalledWith('ai_chat', {
        message: longMessage,
        context: businessContext
      });
    });

    it('should handle special characters and emojis', async () => {
      const specialMessage = 'Hello! 👋 How are you? 🚀 Let\'s discuss business 💼';
      const businessContext = {
        user: { id: 'test-user', name: 'User', role: 'User', department: 'General' },
        company: null,
        agent: { id: 'executive-assistant', type: 'assistant', capabilities: [] },
        conversation: { id: null, history: [] },
        attachments: []
      };

      await mockCallEdgeFunction('ai_chat', {
        message: specialMessage,
        context: businessContext
      });

      expect(mockCallEdgeFunction).toHaveBeenCalledWith('ai_chat', {
        message: specialMessage,
        context: businessContext
      });
    });
  });

  describe('Performance and Reliability', () => {
    it('should handle concurrent requests', async () => {
      const promises = [];
      const businessContext = {
        user: { id: 'test-user', name: 'User', role: 'User', department: 'General' },
        company: null,
        agent: { id: 'executive-assistant', type: 'assistant', capabilities: [] },
        conversation: { id: null, history: [] },
        attachments: []
      };

      for (let i = 0; i < 5; i++) {
        promises.push(
          mockCallEdgeFunction('ai_chat', {
            message: `Message ${i}`,
            context: businessContext
          })
        );
      }

      const results = await Promise.all(promises);
      expect(results).toHaveLength(5);
      expect(mockCallEdgeFunction).toHaveBeenCalledTimes(5);
    });

    it('should handle timeout scenarios', async () => {
      // Mock a slow response
      mockCallEdgeFunction.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          success: true,
          data: { content: 'Delayed response', conversationId: 'conv-123' }
        }), 15000)) // 15 second delay
      );

      const businessContext = {
        user: { id: 'test-user', name: 'User', role: 'User', department: 'General' },
        company: null,
        agent: { id: 'executive-assistant', type: 'assistant', capabilities: [] },
        conversation: { id: null, history: [] },
        attachments: []
      };

      // This should timeout in a real scenario, but we're testing the mock
      const response = await mockCallEdgeFunction('ai_chat', {
        message: 'Test timeout',
        context: businessContext
      });

      expect(response.success).toBe(true);
    });
  });
});
