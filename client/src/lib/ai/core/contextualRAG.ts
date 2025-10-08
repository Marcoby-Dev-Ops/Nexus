import { selectData, selectOne, insertOne, updateOne, deleteOne, callEdgeFunction } from '@/lib/database';
import { vectorSearch } from '@/lib/database';
import { logger } from '@/shared/utils/logger';

export interface RAGContext {
  userId: string;
  companyId?: string;
  sessionId?: string;
  currentTopic?: string;
  recentInteractions?: string[];
  userPreferences?: Record<string, any>;
  conversationHistory?: ConversationTurn[];
  agentContext?: AgentContext;
}

export interface ConversationTurn {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: {
    topic?: string;
    intent?: string;
    confidence?: number;
  };
}

export interface AgentContext {
  agentId: string;
  agentType: 'executive' | 'departmental' | 'specialist';
  department?: string;
  currentGoals?: string[];
  expertise?: string[];
  personality?: Record<string, any>;
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
    context_type?: 'conversation' | 'document' | 'thought' | 'business_data';
  };
}

export interface RAGQuery {
  query: string;
  context: RAGContext;
  maxResults?: number;
  threshold?: number;
  includeConversationHistory?: boolean;
  includeBusinessData?: boolean;
}

export interface RAGResult {
  documents: RAGDocument[];
  query: string;
  context: RAGContext;
  totalResults: number;
  processingTime: number;
  contextSummary?: string;
  shouldRetrieve?: boolean;
  rewrittenQuery?: string;
}

export interface DocumentGrade {
  binary_score: 'yes' | 'no';
  confidence: number;
  reasoning?: string;
}

class ContextualRAG {
  private embeddingsCache: Map<string, number[]> = new Map();
  private conversationCache: Map<string, ConversationTurn[]> = new Map();

  async searchRelevantDocuments(query: RAGQuery): Promise<RAGResult> {
    const startTime = Date.now();
    
    try {
      logger.info('Starting contextual RAG search', {
        queryLength: query.query.length,
        hasConversationHistory: !!query.context.conversationHistory?.length,
        agentType: query.context.agentContext?.agentType
      });

      // 1. Decide whether to retrieve or respond directly
      const shouldRetrieve = await this.shouldRetrieveContext(query);
      
      if (!shouldRetrieve) {
        logger.info('Decided not to retrieve context - responding directly');
        return {
          documents: [],
          query: query.query,
          context: query.context,
          totalResults: 0,
          processingTime: Date.now() - startTime,
          shouldRetrieve: false
        };
      }

      // 2. Generate enhanced query with conversation context
      const enhancedQuery = await this.buildEnhancedQuery(query);
      
      // 3. Retrieve documents with context-aware filtering
      const documents = await this.retrieveDocumentsWithContext(query, enhancedQuery);
      
      // 4. Grade documents for relevance
      const gradedDocuments = await this.gradeDocuments(documents, query.query, query.context);
      
      // 5. If documents aren't relevant, rewrite the query
      if (gradedDocuments.length === 0) {
        const rewrittenQuery = await this.rewriteQuery(query.query, query.context);
        logger.info('Documents not relevant, rewriting query', { 
          originalQuery: query.query, 
          rewrittenQuery 
        });
        
        // Try retrieval again with rewritten query
        const retryQuery = { ...query, query: rewrittenQuery };
        const retryEnhancedQuery = await this.buildEnhancedQuery(retryQuery);
        const retryDocuments = await this.retrieveDocumentsWithContext(retryQuery, retryEnhancedQuery);
        const retryGradedDocuments = await this.gradeDocuments(retryDocuments, rewrittenQuery, query.context);
        
        return {
          documents: retryGradedDocuments.slice(0, query.maxResults || 10),
          query: query.query,
          context: query.context,
          totalResults: retryGradedDocuments.length,
          processingTime: Date.now() - startTime,
          shouldRetrieve: true,
          rewrittenQuery
        };
      }
      
      // 6. Add conversation history as context
      const conversationContext = await this.getConversationContext(query.context);
      
      // 7. Rank and filter documents
      const rankedDocuments = await this.rankDocumentsWithContext(gradedDocuments, query, enhancedQuery);
      const filteredDocuments = this.applyThreshold(rankedDocuments, query.threshold || 0.6);
      
      // 8. Generate context summary
      const contextSummary = await this.generateContextSummary(filteredDocuments, conversationContext, query.context);

      return {
        documents: filteredDocuments.slice(0, query.maxResults || 10),
        query: query.query,
        context: query.context,
        totalResults: filteredDocuments.length,
        processingTime: Date.now() - startTime,
        contextSummary,
        shouldRetrieve: true
      };
    } catch (error) {
      logger.error('Error in contextual RAG search:', error);
      return {
        documents: [],
        query: query.query,
        context: query.context,
        totalResults: 0,
        processingTime: Date.now() - startTime,
      };
    }
  }

  private async shouldRetrieveContext(query: RAGQuery): Promise<boolean> {
    try {
      // Simple heuristics to decide if we need context
      const needsContextKeywords = [
        'how', 'what', 'when', 'where', 'why', 'which', 'who',
        'show', 'find', 'search', 'look', 'get', 'retrieve',
        'data', 'information', 'details', 'specific', 'example'
      ];
      
      const queryLower = query.query.toLowerCase();
      const hasContextKeywords = needsContextKeywords.some(keyword => 
        queryLower.includes(keyword)
      );
      
      // Check if it's a simple greeting or command that doesn't need context
      const simpleResponses = [
        'hello', 'hi', 'hey', 'thanks', 'thank you', 'bye', 'goodbye',
        'yes', 'no', 'ok', 'okay', 'sure', 'fine'
      ];
      
      const isSimpleResponse = simpleResponses.some(simple => 
        queryLower.includes(simple)
      );
      
      // Check conversation history for context clues
      const hasRecentContext = query.context.conversationHistory && 
        query.context.conversationHistory.length > 0;
      
      // For now, use simple logic - can be enhanced with LLM decision
      return hasContextKeywords || hasRecentContext || !isSimpleResponse;
    } catch (error) {
      logger.error('Error deciding whether to retrieve context:', error);
      return true; // Default to retrieving
    }
  }

  private async buildEnhancedQuery(query: RAGQuery): Promise<string> {
    const parts = [query.query];

    // Add conversation context to the query
    if (query.context.conversationHistory && query.context.conversationHistory.length > 0) {
      const recentTurns = query.context.conversationHistory.slice(-4); // Last 4 turns
      const conversationContext = recentTurns
        .map(turn => `${turn.role}: ${turn.content}`)
        .join('\n');
      parts.push(`Conversation context: ${conversationContext}`);
    }

    // Add current topic if available
    if (query.context.currentTopic) {
      parts.push(`Current topic: ${query.context.currentTopic}`);
    }

    // Add agent context if available
    if (query.context.agentContext) {
      const agent = query.context.agentContext;
      if (agent.currentGoals && agent.currentGoals.length > 0) {
        parts.push(`Agent goals: ${agent.currentGoals.join(', ')}`);
      }
      if (agent.expertise && agent.expertise.length > 0) {
        parts.push(`Agent expertise: ${agent.expertise.join(', ')}`);
      }
    }

    return parts.join('\n\n');
  }

  private async retrieveDocumentsWithContext(query: RAGQuery, enhancedQuery: string): Promise<RAGDocument[]> {
    try {
      const documents: RAGDocument[] = [];

      // 1. Search documents with enhanced query
      const documentResults = await vectorSearch.searchVectorsByText(
        query.context.userId,
        enhancedQuery,
        query.maxResults || 15,
        {
          company_id: query.context.companyId,
          type: 'document'
        }
      );

      documents.push(...documentResults.map((result: any) => ({
        id: result.id,
        content: result.content,
        metadata: {
          source: result.title || 'Document',
          timestamp: new Date().toISOString(),
          type: 'document',
          tags: result.tags || [],
          relevance_score: result.similarity || 0,
          context_type: 'document'
        }
      })));

      // 2. Search thoughts with enhanced query
      const thoughtResults = await vectorSearch.searchVectorsByText(
        query.context.userId,
        enhancedQuery,
        Math.floor((query.maxResults || 15) / 2),
        {
          company_id: query.context.companyId,
          type: 'thought'
        }
      );

      documents.push(...thoughtResults.map((result: any) => ({
        id: result.id,
        content: result.content,
        metadata: {
          source: result.title || 'Thought',
          timestamp: new Date().toISOString(),
          type: 'thought',
          tags: result.tags || [],
          relevance_score: result.similarity || 0,
          context_type: 'thought'
        }
      })));

      // 3. Search conversation history if enabled
      if (query.includeConversationHistory && query.context.conversationHistory) {
        const conversationDocs = await this.searchConversationHistory(query.context);
        documents.push(...conversationDocs);
      }

      // 4. Search business data if enabled
      if (query.includeBusinessData && query.context.companyId) {
        const businessDocs = await this.searchBusinessData(query.context);
        documents.push(...businessDocs);
      }

      return documents;
    } catch (error) {
      logger.error('Error retrieving documents with context:', error);
      return [];
    }
  }

  private async gradeDocuments(
    documents: RAGDocument[], 
    question: string, 
    context: RAGContext
  ): Promise<RAGDocument[]> {
    try {
      const gradedDocuments: RAGDocument[] = [];
      
      for (const doc of documents) {
        const grade = await this.gradeSingleDocument(doc, question, context);
        
        if (grade.binary_score === 'yes' && grade.confidence > 0.5) {
          // Boost relevance score based on grading confidence
          const boostedScore = Math.min(
            (doc.metadata.relevance_score || 0) + (grade.confidence * 0.2), 
            1.0
          );
          
          gradedDocuments.push({
            ...doc,
            metadata: {
              ...doc.metadata,
              relevance_score: boostedScore
            }
          });
        }
      }
      
      logger.info('Graded documents', {
        totalDocuments: documents.length,
        relevantDocuments: gradedDocuments.length,
        questionLength: question.length
      });
      
      return gradedDocuments;
    } catch (error) {
      logger.error('Error grading documents:', error);
      return documents; // Return original documents if grading fails
    }
  }

  private async gradeSingleDocument(
    document: RAGDocument, 
    question: string, 
    context: RAGContext
  ): Promise<DocumentGrade> {
    try {
      // Simple keyword-based grading for now
      // In production, this would use an LLM with structured output
      
      const questionWords = question.toLowerCase().split(/\s+/);
      const docWords = document.content.toLowerCase().split(/\s+/);
      
      // Count matching words
      const matches = questionWords.filter(word => 
        word.length > 3 && docWords.includes(word)
      );
      
      const matchRatio = matches.length / questionWords.length;
      
      // Boost score for conversation history and recent documents
      let confidence = matchRatio;
      if (document.metadata.context_type === 'conversation') {
        confidence += 0.2;
      }
      
      const docAge = Date.now() - new Date(document.metadata.timestamp).getTime();
      const daysOld = docAge / (1000 * 60 * 60 * 24);
      if (daysOld < 7) {
        confidence += 0.1;
      }
      
      return {
        binary_score: confidence > 0.3 ? 'yes' : 'no',
        confidence: Math.min(confidence, 1.0),
        reasoning: `Matched ${matches.length} words: ${matches.join(', ')}`
      };
    } catch (error) {
      logger.error('Error grading single document:', error);
      return {
        binary_score: 'no',
        confidence: 0,
        reasoning: 'Error during grading'
      };
    }
  }

  private async rewriteQuery(originalQuery: string, context: RAGContext): Promise<string> {
    try {
      // Simple query rewriting logic
      // In production, this would use an LLM to generate better queries
      
      let rewrittenQuery = originalQuery;
      
      // Add context from conversation history
      if (context.conversationHistory && context.conversationHistory.length > 0) {
        const recentTurns = context.conversationHistory.slice(-3);
        const contextKeywords = recentTurns
          .map(turn => turn.content)
          .join(' ')
          .split(/\s+/)
          .filter(word => word.length > 4)
          .slice(0, 3);
        
        if (contextKeywords.length > 0) {
          rewrittenQuery = `${originalQuery} ${contextKeywords.join(' ')}`;
        }
      }
      
      // Add current topic if available
      if (context.currentTopic) {
        rewrittenQuery = `${rewrittenQuery} ${context.currentTopic}`;
      }
      
      // Add agent expertise if available
      if (context.agentContext?.expertise) {
        const expertiseKeywords = context.agentContext.expertise.slice(0, 2);
        rewrittenQuery = `${rewrittenQuery} ${expertiseKeywords.join(' ')}`;
      }
      
      logger.info('Rewrote query', {
        originalQuery,
        rewrittenQuery
      });
      
      return rewrittenQuery;
    } catch (error) {
      logger.error('Error rewriting query:', error);
      return originalQuery;
    }
  }

  private async searchConversationHistory(context: RAGContext): Promise<RAGDocument[]> {
    try {
      if (!context.conversationHistory || context.conversationHistory.length === 0) {
        return [];
      }

      // Convert recent conversation turns to documents
      const recentTurns = context.conversationHistory.slice(-10); // Last 10 turns
      return recentTurns.map((turn, index) => ({
        id: `conv_${index}`,
        content: `${turn.role}: ${turn.content}`,
        metadata: {
          source: 'Conversation History',
          timestamp: turn.timestamp,
          type: 'conversation',
          tags: turn.metadata?.topic ? [turn.metadata.topic] : [],
          relevance_score: 0.8, // High relevance for recent conversation
          context_type: 'conversation'
        }
      }));
    } catch (error) {
      logger.error('Error searching conversation history:', error);
      return [];
    }
  }

  private async searchBusinessData(context: RAGContext): Promise<RAGDocument[]> {
    try {
      if (!context.companyId) return [];

      // Search for business-related data (integrations, analytics, etc.)
      const businessResults = await vectorSearch.searchVectorsByText(
        context.userId,
        'business data analytics metrics performance',
        5,
        {
          company_id: context.companyId,
          type: 'business_data'
        }
      );

      return businessResults.map((result: any) => ({
        id: result.id,
        content: result.content,
        metadata: {
          source: result.title || 'Business Data',
          timestamp: new Date().toISOString(),
          type: 'business_data',
          tags: result.tags || [],
          relevance_score: result.similarity || 0,
          context_type: 'business_data'
        }
      }));
    } catch (error) {
      logger.error('Error searching business data:', error);
      return [];
    }
  }

  private async getConversationContext(context: RAGContext): Promise<string> {
    if (!context.conversationHistory || context.conversationHistory.length === 0) {
      return '';
    }

    const recentTurns = context.conversationHistory.slice(-6); // Last 6 turns
    return recentTurns
      .map(turn => `${turn.role}: ${turn.content}`)
      .join('\n');
  }

  private async rankDocumentsWithContext(
    documents: RAGDocument[], 
    query: RAGQuery, 
    enhancedQuery: string
  ): Promise<RAGDocument[]> {
    try {
      // Enhanced ranking based on multiple factors
      const rankedDocuments = documents.map(doc => {
        let score = doc.metadata.relevance_score || 0;

        // Boost conversation history
        if (doc.metadata.context_type === 'conversation') {
          score += 0.2;
        }

        // Boost recent documents
        const docAge = Date.now() - new Date(doc.metadata.timestamp).getTime();
        const daysOld = docAge / (1000 * 60 * 60 * 24);
        if (daysOld < 7) {
          score += 0.1;
        }

        // Boost documents matching current topic
        if (query.context.currentTopic && 
            doc.content.toLowerCase().includes(query.context.currentTopic.toLowerCase())) {
          score += 0.15;
        }

        // Boost documents matching agent expertise
        if (query.context.agentContext?.expertise) {
          const expertiseMatch = query.context.agentContext.expertise.some(exp =>
            doc.content.toLowerCase().includes(exp.toLowerCase())
          );
          if (expertiseMatch) {
            score += 0.1;
          }
        }

        return {
          ...doc,
          metadata: {
            ...doc.metadata,
            relevance_score: Math.min(score, 1.0) // Cap at 1.0
          }
        };
      });

      return rankedDocuments.sort((a, b) => 
        (b.metadata.relevance_score || 0) - (a.metadata.relevance_score || 0)
      );
    } catch (error) {
      logger.error('Error ranking documents with context:', error);
      return documents;
    }
  }

  private applyThreshold(documents: RAGDocument[], threshold: number): RAGDocument[] {
    return documents.filter(doc => (doc.metadata.relevance_score || 0) >= threshold);
  }

  private async generateContextSummary(
    documents: RAGDocument[], 
    conversationContext: string, 
    context: RAGContext
  ): Promise<string> {
    try {
      const summaryParts = [];

      // Add conversation context
      if (conversationContext) {
        summaryParts.push(`Recent conversation:\n${conversationContext}`);
      }

      // Add relevant documents summary
      if (documents.length > 0) {
        const docSummary = documents
          .slice(0, 3) // Top 3 most relevant
          .map(doc => `[${doc.metadata.source}]: ${doc.content.substring(0, 200)}...`)
          .join('\n\n');
        summaryParts.push(`Relevant context:\n${docSummary}`);
      }

      // Add current topic
      if (context.currentTopic) {
        summaryParts.push(`Current focus: ${context.currentTopic}`);
      }

      return summaryParts.join('\n\n');
    } catch (error) {
      logger.error('Error generating context summary:', error);
      return '';
    }
  }

  async generateContextualResponse(query: string, context: RAGContext): Promise<string> {
    try {
      const ragQuery: RAGQuery = {
        query,
        context,
        maxResults: 5,
        threshold: 0.6,
        includeConversationHistory: true,
        includeBusinessData: true
      };

      const result = await this.searchRelevantDocuments(ragQuery);
      
      if (!result.shouldRetrieve) {
        return "I can help you with that directly. What would you like to know?";
      }
      
      if (result.documents.length === 0) {
        return "I don't have enough relevant context to provide a specific answer. Could you provide more details about what you're looking for?";
      }

      // Build a comprehensive response using the context
      const contextText = result.contextSummary || result.documents
        .map(doc => doc.content)
        .join('\n\n');

      return `Based on our conversation and your business context, here's what I found:\n\n${contextText.substring(0, 800)}...`;
    } catch (error) {
      logger.error('Error generating contextual response:', error);
      return "I'm having trouble accessing your contextual information right now. Please try again.";
    }
  }

  async updateUserContext(userId: string, context: Partial<RAGContext>): Promise<void> {
    try {
      // Store user context in database
      await insertOne('user_contexts', {
        user_id: userId,
        context_data: context,
        updated_at: new Date().toISOString()
      });

      // Update conversation cache
      if (context.conversationHistory) {
        this.conversationCache.set(userId, context.conversationHistory);
      }

      logger.info('Updated user context', { 
        userId, 
        contextKeys: Object.keys(context),
        conversationTurns: context.conversationHistory?.length 
      });
    } catch (error) {
      logger.error('Error updating user context:', error);
    }
  }

  async addConversationTurn(
    userId: string, 
    turn: ConversationTurn, 
    context: RAGContext
  ): Promise<void> {
    try {
      // Update conversation history
      const currentHistory = context.conversationHistory || [];
      const updatedHistory = [...currentHistory, turn];
      
      // Keep only last 50 turns to prevent memory bloat
      const trimmedHistory = updatedHistory.slice(-50);
      
      // Update context
      await this.updateUserContext(userId, {
        ...context,
        conversationHistory: trimmedHistory
      });

      // Store turn in database for persistence
      await insertOne('conversation_turns', {
        user_id: userId,
        company_id: context.companyId,
        session_id: context.sessionId,
        role: turn.role,
        content: turn.content,
        metadata: turn.metadata,
        created_at: turn.timestamp
      });

      logger.info('Added conversation turn', { 
        userId, 
        role: turn.role, 
        contentLength: turn.content.length 
      });
    } catch (error) {
      logger.error('Error adding conversation turn:', error);
    }
  }

  async storeDocument(
    userId: string,
    content: string,
    metadata: {
      title?: string;
      source?: string;
      type?: string;
      tags?: string[];
      companyId?: string;
    }
  ): Promise<void> {
    try {
      // Store document with embedding
      await vectorSearch.insertDocumentWithEmbedding({
        title: metadata.title || 'Document',
        content,
        embedding: [], // Will be generated by the database trigger
        user_id: userId,
        company_id: metadata.companyId,
        tags: metadata.tags,
        metadata: {
          source: metadata.source || 'user_input',
          type: metadata.type || 'document',
          ...metadata
        }
      });
    } catch (error) {
      logger.error('Error storing document:', error);
    }
  }

  async storeThought(
    userId: string,
    content: string,
    metadata: {
      title?: string;
      category?: string;
      tags?: string[];
      companyId?: string;
    }
  ): Promise<void> {
    try {
      // Store thought with embedding
      await vectorSearch.insertThoughtWithEmbedding({
        title: metadata.title || 'Thought',
        content,
        embedding: [], // Will be generated by the database trigger
        user_id: userId,
        company_id: metadata.companyId,
        category: metadata.category,
        tags: metadata.tags,
        metadata: {
          type: 'thought',
          ...metadata
        }
      });
    } catch (error) {
      logger.error('Error storing thought:', error);
    }
  }
}

export { ContextualRAG };
export const contextualRAG = new ContextualRAG(); 
