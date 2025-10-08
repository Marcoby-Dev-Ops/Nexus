import type { RAGContext } from './contextualRAG';
import { contextualRAG } from './contextualRAG';
import { selectData, insertOne, updateOne } from '@/lib/database';
import { logger } from '@/shared/utils/logger';

export interface MemoryItem {
  id: string;
  userId: string;
  type: 'conversation' | 'fact' | 'preference' | 'goal' | 'learning';
  content: string;
  context: Record<string, any>;
  importance: number; // 1-10 scale
  lastAccessed: Date;
  accessCount: number;
  tags: string[];
  relationships: string[]; // IDs of related memory items
}

export interface ConversationMemory {
  conversationId: string;
  summary: string;
  keyPoints: string[];
  actionItems: string[];
  followUpQuestions: string[];
  emotionalTone: 'positive' | 'neutral' | 'negative';
  userSatisfaction?: number;
}

export interface MemoryQuery {
  userId: string;
  query: string;
  context?: RAGContext;
  memoryTypes?: MemoryItem['type'][];
  limit?: number;
  minImportance?: number;
}

class EnhancedMemoryService {
  private memoryCache: Map<string, MemoryItem[]> = new Map();

  /**
   * Store a new memory item with automatic importance scoring
   */
  async storeMemory(
    userId: string,
    type: MemoryItem['type'],
    content: string,
    context: Record<string, any> = {},
    tags: string[] = []
  ): Promise<string> {
    try {
      // Calculate importance based on content and context
      const importance = await this.calculateImportance(content, context, type);
      
      // Find related memories
      const relationships = await this.findRelatedMemories(userId, content, type);
      
      const memoryItem: Omit<MemoryItem, 'id' | 'lastAccessed' | 'accessCount'> = {
        userId,
        type,
        content,
        context,
        importance,
        tags,
        relationships
      };

      const { data, error } = await insertOne('user_memories', memoryItem);
      
      if (error) {
        logger.error('Error storing memory:', error);
        throw error;
      }

      // Update cache
      this.updateMemoryCache(userId, data);
      
      return data.id;
    } catch (error) {
      logger.error('Error in storeMemory:', error);
      throw error;
    }
  }

  /**
   * Retrieve relevant memories for a given query
   */
  async retrieveMemories(query: MemoryQuery): Promise<MemoryItem[]> {
    try {
      // First check cache
      const cachedMemories = this.memoryCache.get(query.userId);
      if (cachedMemories) {
        const relevant = this.filterMemoriesByQuery(cachedMemories, query);
        if (relevant.length >= (query.limit || 5)) {
          return relevant.slice(0, query.limit || 5);
        }
      }

      // Build search query
      const searchQuery = {
        query: query.query,
        context: query.context || { userId: query.userId },
        maxResults: query.limit || 10,
        threshold: 0.6
      };

      // Use existing RAG system for semantic search
      const ragResult = await contextualRAG.searchRelevantDocuments(searchQuery);
      
      // Get memory items from database
      const { data: memories, error } = await selectData(
        'user_memories',
        '*',
        { user_id: query.userId }
      );

      if (error) {
        logger.error('Error retrieving memories:', error);
        return [];
      }

      // Filter and rank memories
      const filteredMemories = this.filterAndRankMemories(
        memories || [],
        query
      );

      // Update cache
      this.updateMemoryCache(query.userId, filteredMemories);

      return filteredMemories.slice(0, query.limit || 5);
    } catch (error) {
      logger.error('Error in retrieveMemories:', error);
      return [];
    }
  }

  /**
   * Store conversation summary and key insights
   */
  async storeConversationMemory(
    conversationId: string,
    messages: Array<{ role: string; content: string }>,
    userId: string
  ): Promise<void> {
    try {
      // Generate conversation summary
      const summary = await this.generateConversationSummary(messages);
      
      // Extract key points and action items
      const keyPoints = await this.extractKeyPoints(messages);
      const actionItems = await this.extractActionItems(messages);
      
      // Analyze emotional tone
      const emotionalTone = await this.analyzeEmotionalTone(messages);
      
      // Generate follow-up questions
      const followUpQuestions = await this.generateFollowUpQuestions(messages, summary);

      const conversationMemory: ConversationMemory = {
        conversationId,
        summary,
        keyPoints,
        actionItems,
        followUpQuestions,
        emotionalTone
      };

      // Store conversation memory
      await insertOne('conversation_memories', {
        conversation_id: conversationId,
        user_id: userId,
        memory_data: conversationMemory
      });

      // Store key insights as individual memory items
      for (const point of keyPoints) {
        await this.storeMemory(userId, 'fact', point, {
          source: 'conversation',
          conversationId
        });
      }

      for (const action of actionItems) {
        await this.storeMemory(userId, 'goal', action, {
          source: 'conversation',
          conversationId,
          type: 'action_item'
        });
      }

    } catch (error) {
      logger.error('Error storing conversation memory:', error);
    }
  }

  /**
   * Update memory importance based on usage patterns
   */
  async updateMemoryAccess(memoryId: string, userId: string): Promise<void> {
    try {
      const { data: memory } = await selectData(
        'user_memories',
        '*',
        { id: memoryId, user_id: userId }
      );

      if (memory) {
        // Increase access count and update last accessed
        await updateOne('user_memories', memoryId, {
          access_count: (memory.access_count || 0) + 1,
          last_accessed: new Date().toISOString()
        });

        // Adjust importance based on usage
        const newImportance = this.adjustImportance(
          memory.importance,
          memory.access_count + 1
        );

        await updateOne('user_memories', memoryId, {
          importance: newImportance
        });
      }
    } catch (error) {
      logger.error('Error updating memory access:', error);
    }
  }

  /**
   * Generate contextual response using memory
   */
  async generateContextualResponse(
    userId: string,
    query: string,
    context?: RAGContext
  ): Promise<string> {
    try {
      // Retrieve relevant memories
      const memories = await this.retrieveMemories({
        userId,
        query,
        context,
        limit: 5
      });

      if (memories.length === 0) {
        return await contextualRAG.generateContextualResponse(query, context || { userId });
      }

      // Build memory context
      const memoryContext = memories
        .map(memory => `${memory.type.toUpperCase()}: ${memory.content}`)
        .join('\n');

      // Combine with RAG response
      const ragResponse = await contextualRAG.generateContextualResponse(query, context || { userId });
      
      return `Based on our previous conversations and your preferences:\n\n${ragResponse}\n\nRelevant context from our history:\n${memoryContext}`;
    } catch (error) {
      logger.error('Error generating contextual response:', error);
      return await contextualRAG.generateContextualResponse(query, context || { userId });
    }
  }

  // Private helper methods
  private async calculateImportance(
    content: string,
    context: Record<string, any>,
    type: MemoryItem['type']
  ): Promise<number> {
    // Base importance by type
    const typeImportance = {
      'goal': 8,
      'preference': 7,
      'fact': 6,
      'learning': 7,
      'conversation': 5
    };

    let importance = typeImportance[type] || 5;

    // Adjust based on content length and complexity
    if (content.length > 100) importance += 1;
    if (content.includes('important') || content.includes('critical')) importance += 2;
    if (context.urgent) importance += 2;

    return Math.min(importance, 10);
  }

  private async findRelatedMemories(
    userId: string,
    content: string,
    type: MemoryItem['type']
  ): Promise<string[]> {
    // Simple keyword-based relationship finding
    // In a real implementation, this would use semantic similarity
    const keywords = content.toLowerCase().split(' ').filter(word => word.length > 3);
    
    const { data: existingMemories } = await selectData(
      'user_memories',
      'id, content',
      { user_id: userId }
    );

    const related: string[] = [];
    for (const memory of existingMemories || []) {
      const memoryKeywords = memory.content.toLowerCase().split(' ').filter(word => word.length > 3);
      const commonKeywords = keywords.filter(keyword => memoryKeywords.includes(keyword));
      
      if (commonKeywords.length >= 2) {
        related.push(memory.id);
      }
    }

    return related.slice(0, 5); // Limit to 5 related memories
  }

  private filterMemoriesByQuery(memories: MemoryItem[], query: MemoryQuery): MemoryItem[] {
    return memories
      .filter(memory => {
        if (query.memoryTypes && !query.memoryTypes.includes(memory.type)) return false;
        if (query.minImportance && memory.importance < query.minImportance) return false;
        return true;
      })
      .sort((a, b) => b.importance - a.importance);
  }

  private filterAndRankMemories(memories: any[], query: MemoryQuery): MemoryItem[] {
    return memories
      .filter(memory => {
        if (query.memoryTypes && !query.memoryTypes.includes(memory.type)) return false;
        if (query.minImportance && memory.importance < query.minImportance) return false;
        return true;
      })
      .sort((a, b) => {
        // Sort by importance first, then by last accessed
        if (b.importance !== a.importance) return b.importance - a.importance;
        return new Date(b.last_accessed).getTime() - new Date(a.last_accessed).getTime();
      });
  }

  private updateMemoryCache(userId: string, memories: MemoryItem[]): void {
    this.memoryCache.set(userId, memories);
  }

  private adjustImportance(currentImportance: number, accessCount: number): number {
    // Increase importance for frequently accessed memories
    if (accessCount > 10) return Math.min(currentImportance + 1, 10);
    if (accessCount > 5) return Math.min(currentImportance + 0.5, 10);
    return currentImportance;
  }

  // Placeholder methods for AI-powered features
  private async generateConversationSummary(messages: Array<{ role: string; content: string }>): Promise<string> {
    // In a real implementation, this would use an AI model
    const userMessages = messages.filter(m => m.role === 'user').map(m => m.content);
    return `Conversation about: ${userMessages.slice(-3).join(', ')}`;
  }

  private async extractKeyPoints(messages: Array<{ role: string; content: string }>): Promise<string[]> {
    // In a real implementation, this would use an AI model
    return messages
      .filter(m => m.role === 'assistant')
      .slice(-3)
      .map(m => m.content.substring(0, 100));
  }

  private async extractActionItems(messages: Array<{ role: string; content: string }>): Promise<string[]> {
    // In a real implementation, this would use an AI model
    return messages
      .filter(m => m.content.includes('action') || m.content.includes('todo'))
      .map(m => m.content.substring(0, 100));
  }

  private async analyzeEmotionalTone(messages: Array<{ role: string; content: string }>): Promise<'positive' | 'neutral' | 'negative'> {
    // In a real implementation, this would use sentiment analysis
    const positiveWords = ['great', 'good', 'excellent', 'happy', 'satisfied'];
    const negativeWords = ['bad', 'terrible', 'frustrated', 'angry', 'disappointed'];
    
    const content = messages.map(m => m.content).join(' ').toLowerCase();
    const positiveCount = positiveWords.filter(word => content.includes(word)).length;
    const negativeCount = negativeWords.filter(word => content.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private async generateFollowUpQuestions(
    messages: Array<{ role: string; content: string }>,
    summary: string
  ): Promise<string[]> {
    // In a real implementation, this would use an AI model
    return [
      'Would you like me to elaborate on any of these points?',
      'Is there anything specific you\'d like to explore further?'
    ];
  }
}

export const enhancedMemoryService = new EnhancedMemoryService();
