import { supabase } from '@/lib/supabase';

export interface RAGContext {
  userId: string;
  companyId?: string;
  sessionId?: string;
  currentTopic?: string;
  recentInteractions?: string[];
  userPreferences?: Record<string, any>;
}

export interface RAGDocument {
  id: string;
  content: string;
  metadata: {
    source: string;
    timestamp: string;
    type: string;
    tags?: string[];
    relevance_score?: number;
  };
}

export interface RAGQuery {
  query: string;
  context: RAGContext;
  maxResults?: number;
  threshold?: number;
}

export interface RAGResult {
  documents: RAGDocument[];
  query: string;
  context: RAGContext;
  totalResults: number;
  processingTime: number;
}

class ContextualRAG {
  private embeddingsCache: Map<string, number[]> = new Map();

  async searchRelevantDocuments(query: RAGQuery): Promise<RAGResult> {
    const startTime = Date.now();
    
    try {
      // Extract relevant documents based on query and context
      const documents = await this.retrieveDocuments(query);
      
      // Filter and rank documents based on relevance
      const rankedDocuments = await this.rankDocuments(documents, query);
      
      // Apply threshold filtering
      const filteredDocuments = this.applyThreshold(rankedDocuments, query.threshold || 0.7);
      
      return {
        documents: filteredDocuments.slice(0, query.maxResults || 10),
        query: query.query,
        context: query.context,
        totalResults: filteredDocuments.length,
        processingTime: Date.now() - startTime,
      };
    } catch (error) {
      console.error('Error in contextual RAG search:', error);
      return {
        documents: [],
        query: query.query,
        context: query.context,
        totalResults: 0,
        processingTime: Date.now() - startTime,
      };
    }
  }

  async retrieveDocuments(query: RAGQuery): Promise<RAGDocument[]> {
    try {
      // Search across multiple data sources
      const [thoughts, interactions, conversations] = await Promise.all([
        this.searchThoughts(query),
        this.searchInteractions(query),
        this.searchConversations(query),
      ]);

      return [...thoughts, ...interactions, ...conversations];
    } catch (error) {
      console.error('Error retrieving documents:', error);
      return [];
    }
  }

  private async searchThoughts(query: RAGQuery): Promise<RAGDocument[]> {
    try {
      const { data, error } = await supabase
        .from('thoughts')
        .select('*')
        .eq('userid', query.context.userId)
        .ilike('content', `%${query.query}%`)
        .order('createdat', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error searching thoughts:', error);
        return [];
      }

      return (data || []).map(thought => ({
        id: thought.id,
        content: thought.content || '',
        metadata: {
          source: 'thoughts',
          timestamp: thought.createdat || new Date().toISOString(),
          type: 'thought',
          tags: thought.tags || [],
        },
      }));
    } catch (error) {
      console.error('Error in searchThoughts:', error);
      return [];
    }
  }

  private async searchInteractions(query: RAGQuery): Promise<RAGDocument[]> {
    try {
      const { data, error } = await supabase
        .from('interactions')
        .select('*')
        .eq('userid', query.context.userId)
        .or(`prompt_text.ilike.%${query.query}%,ai_response.ilike.%${query.query}%`)
        .order('createdat', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error searching interactions:', error);
        return [];
      }

      return (data || []).map(interaction => ({
        id: interaction.id,
        content: `${interaction.prompt_text || ''}\n${interaction.ai_response || ''}`,
        metadata: {
          source: 'interactions',
          timestamp: interaction.createdat || new Date().toISOString(),
          type: 'interaction',
          tags: interaction.metadata?.topic_tags || [],
        },
      }));
    } catch (error) {
      console.error('Error in searchInteractions:', error);
      return [];
    }
  }

  private async searchConversations(query: RAGQuery): Promise<RAGDocument[]> {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('userid', query.context.userId)
        .ilike('content', `%${query.query}%`)
        .order('createdat', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error searching conversations:', error);
        return [];
      }

      return (data || []).map(conversation => ({
        id: conversation.id,
        content: conversation.content || '',
        metadata: {
          source: 'conversations',
          timestamp: conversation.createdat || new Date().toISOString(),
          type: 'conversation',
          tags: conversation.metadata?.topic_tags || [],
        },
      }));
    } catch (error) {
      console.error('Error in searchConversations:', error);
      return [];
    }
  }

  private async rankDocuments(documents: RAGDocument[], query: RAGQuery): Promise<RAGDocument[]> {
    // Simple ranking based on content similarity and recency
    return documents.map(doc => ({
      ...doc,
      metadata: {
        ...doc.metadata,
        relevance_score: this.calculateRelevanceScore(doc, query),
      },
    })).sort((a, b) => (b.metadata.relevance_score || 0) - (a.metadata.relevance_score || 0));
  }

  private calculateRelevanceScore(document: RAGDocument, query: RAGQuery): number {
    let score = 0;
    
    // Content similarity (simple keyword matching)
    const queryWords = query.query.toLowerCase().split(' ');
    const contentWords = document.content.toLowerCase().split(' ');
    const matchingWords = queryWords.filter(word => contentWords.includes(word));
    score += (matchingWords.length / queryWords.length) * 0.5;
    
    // Recency bonus
    const docDate = new Date(document.metadata.timestamp);
    const daysSince = (Date.now() - docDate.getTime()) / (1000 * 60 * 60 * 24);
    score += Math.max(0, 1 - daysSince / 30) * 0.3;
    
    // Context relevance
    if (query.context.currentTopic && document.metadata.tags?.includes(query.context.currentTopic)) {
      score += 0.2;
    }
    
    return Math.min(1, score);
  }

  private applyThreshold(documents: RAGDocument[], threshold: number): RAGDocument[] {
    return documents.filter(doc => (doc.metadata.relevance_score || 0) >= threshold);
  }

  async generateContextualResponse(query: string, context: RAGContext): Promise<string> {
    try {
      const ragQuery: RAGQuery = {
        query,
        context,
        maxResults: 5,
        threshold: 0.6,
      };

      const result = await this.searchRelevantDocuments(ragQuery);
      
      if (result.documents.length === 0) {
        return "I don't have enough relevant context to provide a specific answer. Could you provide more details?";
      }

      // Combine relevant documents into context
      const contextText = result.documents
        .map(doc => doc.content)
        .join('\n\n');

      // In a real implementation, this would call an AI model
      // For now, return a simple response based on the context
      return `Based on your previous interactions and thoughts, here's what I found:\n\n${contextText.substring(0, 500)}...`;
    } catch (error) {
      console.error('Error generating contextual response:', error);
      return "I'm having trouble accessing your contextual information right now. Please try again.";
    }
  }

  async updateUserContext(userId: string, context: Partial<RAGContext>): Promise<void> {
    try {
      // Store user context for future queries
      const { error } = await supabase
        .from('user_contexts')
        .upsert({
          userid: userId,
          context_data: context,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error updating user context:', error);
      }
    } catch (error) {
      console.error('Error in updateUserContext:', error);
    }
  }
}

export { ContextualRAG };
export const contextualRAG = new ContextualRAG(); 