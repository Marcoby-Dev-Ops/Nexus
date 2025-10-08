import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/index';
import type { MemoryItem, ConversationMemory } from '@/lib/ai/enhancedMemoryService';
import { enhancedMemoryService } from '@/lib/ai/enhancedMemoryService';
import { logger } from '@/shared/utils/logger';

interface UseEnhancedMemoryOptions {
  conversationId?: string;
  autoStoreMemories?: boolean;
  memoryTypes?: MemoryItem['type'][];
  minImportance?: number;
}

interface MemoryContext {
  memories: MemoryItem[];
  conversationMemory?: ConversationMemory;
  loading: boolean;
  error: string | null;
  storeMemory: (type: MemoryItem['type'], content: string, context?: Record<string, any>, tags?: string[]) => Promise<void>;
  retrieveMemories: (query: string) => Promise<MemoryItem[]>;
  storeConversationMemory: (messages: Array<{ role: string; content: string }>) => Promise<void>;
  clearMemories: () => void;
}

export const useEnhancedMemory = (options: UseEnhancedMemoryOptions = {}): MemoryContext => {
  const { user } = useAuth();
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [conversationMemory, setConversationMemory] = useState<ConversationMemory | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    conversationId,
    autoStoreMemories = true,
    memoryTypes,
    minImportance = 5
  } = options;

  // Load conversation memory when conversationId changes
  useEffect(() => {
    if (conversationId && user?.id) {
      loadConversationMemory();
    }
  }, [conversationId, user?.id]);

  const loadConversationMemory = useCallback(async () => {
    if (!conversationId || !user?.id) return;

    setLoading(true);
    setError(null);

    try {
      // Load conversation memory from database
      const { data, error: dbError } = await fetch(`/api/conversation-memory/${conversationId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.id}`
        }
      }).then(res => res.json());

      if (dbError) {
        throw new Error(dbError);
      }

      if (data?.memory_data) {
        setConversationMemory(data.memory_data);
      }
    } catch (err) {
      logger.error('Error loading conversation memory:', err);
      setError('Failed to load conversation memory');
    } finally {
      setLoading(false);
    }
  }, [conversationId, user?.id]);

  const storeMemory = useCallback(async (
    type: MemoryItem['type'],
    content: string,
    context: Record<string, any> = {},
    tags: string[] = []
  ) => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const memoryId = await enhancedMemoryService.storeMemory(
        user.id,
        type,
        content,
        context,
        tags
      );

      // Add to local state
      const newMemory: MemoryItem = {
        id: memoryId,
        userId: user.id,
        type,
        content,
        context,
        importance: 5, // Will be calculated by the service
        lastAccessed: new Date(),
        accessCount: 0,
        tags,
        relationships: []
      };

      setMemories(prev => [newMemory, ...prev]);
    } catch (err) {
      logger.error('Error storing memory:', err);
      setError('Failed to store memory');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const retrieveMemories = useCallback(async (query: string): Promise<MemoryItem[]> => {
    if (!user?.id) return [];

    try {
      const retrievedMemories = await enhancedMemoryService.retrieveMemories({
        userId: user.id,
        query,
        memoryTypes,
        limit: 10,
        minImportance
      });

      // Update local state
      setMemories(prev => {
        const existingIds = new Set(prev.map(m => m.id));
        const newMemories = retrievedMemories.filter(m => !existingIds.has(m.id));
        return [...newMemories, ...prev];
      });

      return retrievedMemories;
    } catch (err) {
      logger.error('Error retrieving memories:', err);
      setError('Failed to retrieve memories');
      return [];
    }
  }, [user?.id, memoryTypes, minImportance]);

  const storeConversationMemory = useCallback(async (
    messages: Array<{ role: string; content: string }>
  ) => {
    if (!conversationId || !user?.id) return;

    try {
      await enhancedMemoryService.storeConversationMemory(
        conversationId,
        messages,
        user.id
      );

      // Reload conversation memory
      await loadConversationMemory();
    } catch (err) {
      logger.error('Error storing conversation memory:', err);
      setError('Failed to store conversation memory');
    }
  }, [conversationId, user?.id, loadConversationMemory]);

  const clearMemories = useCallback(() => {
    setMemories([]);
    setConversationMemory(undefined);
    setError(null);
  }, []);

  // Auto-store important messages as memories
  const autoStoreMessageAsMemory = useCallback(async (
    role: string,
    content: string,
    context?: Record<string, any>
  ) => {
    if (!autoStoreMemories || !user?.id) return;

    // Only store assistant messages that seem important
    if (role === 'assistant' && content.length > 50) {
      const importantKeywords = ['important', 'key', 'critical', 'remember', 'note', 'action'];
      const hasImportantContent = importantKeywords.some(keyword => 
        content.toLowerCase().includes(keyword)
      );

      if (hasImportantContent) {
        await storeMemory('fact', content, {
          ...context,
          source: 'conversation',
          conversationId
        });
      }
    }

    // Store user preferences and goals
    if (role === 'user') {
      const preferenceKeywords = ['prefer', 'like', 'want', 'need', 'goal', 'target'];
      const hasPreferences = preferenceKeywords.some(keyword => 
        content.toLowerCase().includes(keyword)
      );

      if (hasPreferences) {
        const type = content.toLowerCase().includes('goal') ? 'goal' : 'preference';
        await storeMemory(type, content, {
          ...context,
          source: 'conversation',
          conversationId
        });
      }
    }
  }, [autoStoreMemories, user?.id, storeMemory, conversationId]);

  return {
    memories,
    conversationMemory,
    loading,
    error,
    storeMemory,
    retrieveMemories,
    storeConversationMemory,
    clearMemories,
    autoStoreMessageAsMemory
  };
};
