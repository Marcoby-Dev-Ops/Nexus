import { useAIChatStore } from '../../src/lib/stores/aiChatStore';

// Mock fetch for API calls
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('aiChatStore API Integration', () => {
  beforeEach(() => {
    // Reset store state manually since there's no reset method
    useAIChatStore.setState({
      conversations: {},
      activeConversationId: null,
      loading: false,
      error: null,
    });
    mockFetch.mockClear();
  });

  describe('Message Persistence', () => {
    it('should persist messages to API on sendMessage', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      const convId = await useAIChatStore.getState().newConversation('Test');
      await useAIChatStore.getState().sendMessage(convId, 'Hello AI', 'user-123', 'test-company-id');

      expect(mockFetch).toHaveBeenCalledWith('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'persist_messages',
          conversationId: convId,
          messages: expect.arrayContaining([
            expect.objectContaining({ content: 'Hello AI', role: 'user' }),
            expect.objectContaining({ role: 'assistant' })
          ]),
          userId: 'user-123'
        }),
      });
    });

    it('should handle persistence errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const convId = await useAIChatStore.getState().newConversation('Test');
      
      // Should not throw despite network error
      await expect(
        useAIChatStore.getState().sendMessage(convId, 'Hello AI', 'user-123', 'test-company-id')
      ).resolves.not.toThrow();
    });
  });

  describe('Conversation Loading', () => {
    it('should load conversation from API', async () => {
      const mockConversation = {
        id: 'conv-123',
        title: 'Loaded Chat',
        messages: [
          { role: 'user', content: 'Previous message', timestamp: new Date().toISOString() }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockConversation,
      } as Response);

      await useAIChatStore.getState().loadConversation('conv-123');

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/ai/chat?conversationId=conv-123',
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const conversation = useAIChatStore.getState().conversations['conv-123'];
      expect(conversation).toEqual(mockConversation);
    });

    it('should create empty conversation if API load fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as Response);

      await useAIChatStore.getState().loadConversation('conv-404');

      const conversation = useAIChatStore.getState().conversations['conv-404'];
      expect(conversation).toEqual({
        id: 'conv-404',
        title: 'Untitled',
        messages: [],
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed API responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => { throw new Error('Invalid JSON'); },
      } as Response);

      await expect(
        useAIChatStore.getState().loadConversation('malformed-conv')
      ).resolves.not.toThrow();
    });
  });
}); 