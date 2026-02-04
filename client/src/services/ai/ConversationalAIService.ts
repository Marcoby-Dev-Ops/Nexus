/**
 * Conversational AI Service
 * 
 * Provides "ChatGPT but it knows their business" experience by:
 * - Accessing the full client knowledgebase (RAG)
 * - Integrating with the Nexus AI Gateway for real inference
 * - Providing a streaming interface for real-time responses
 */

import { BaseService } from '@/core/services/BaseService';
import type { ServiceResponse } from '@/core/services/BaseService';
import { logger } from '@/shared/utils/logger';
import { quantumBusinessService } from '@/services/business/QuantumBusinessService';
import { selectData } from '@/lib/database';

export interface ConversationContext {
  userId: string;
  organizationId: string;
  businessContext: {
    existingProfiles?: string[];
    knowledgeBase?: ClientKnowledgeBase;
  };
}

export interface ClientKnowledgeBase {
  thoughts: Array<{
    id: string;
    title: string;
    content: string;
    created_at: string;
  }>;
  brainTickets: Array<{
    id: string;
    title: string;
    description: string;
    status: string;
    created_at: string;
  }>;
  userContexts: Array<{
    id: string;
    context_data: unknown;
    created_at: string;
  }>;
  companyData: {
    name?: string;
    industry?: string;
    size?: string;
    tools?: string[];
  };
  userProfile: {
    name?: string;
    role?: string;
    preferences?: string;
  };
}

export class ConversationalAIService extends BaseService {
  private static instance: ConversationalAIService;

  public static getInstance(): ConversationalAIService {
    if (!ConversationalAIService.instance) {
      ConversationalAIService.instance = new ConversationalAIService();
    }
    return ConversationalAIService.instance;
  }

  /**
   * Initialize conversation context with business data and knowledgebase
   */
  async initializeContext(userId: string, organizationId: string): Promise<ServiceResponse<ConversationContext>> {
    try {
      logger.info('Initializing conversation context with knowledgebase', { userId, organizationId });

      // Get existing business data
      const quantumProfile = await quantumBusinessService.getQuantumProfile(organizationId);
      
      // Load client knowledgebase
      const knowledgeBase = await this.loadClientKnowledgeBase(userId, organizationId);
      
      const context: ConversationContext = {
        userId,
        organizationId,
        businessContext: {
          existingProfiles: quantumProfile.success && quantumProfile.data ? ['quantum'] : [],
          knowledgeBase
        }
      };

      return this.createResponse(context);
    } catch (error) {
      logger.error('Error initializing conversation context', { error });
      return this.handleError('Failed to initialize conversation context', error);
    }
  }

  /**
   * Load the client's complete knowledgebase
   */
  private async loadClientKnowledgeBase(userId: string, organizationId: string): Promise<ClientKnowledgeBase> {
    try {
      const thoughtsResponse = await selectData(
        'thoughts',
        'id, title, content, created_at',
        { user_id: userId },
        'created_at DESC',
        10
      );

      const brainTicketsResponse = await selectData(
        'brain_tickets',
        'id, title, description, status, created_at',
        { user_id: userId },
        'created_at DESC',
        10
      );

      const userContextsResponse = await selectData(
        'user_contexts',
        'id, context_data, created_at',
        { user_id: userId },
        'created_at DESC',
        5
      );

      const companyResponse = await selectData(
        'companies',
        'name, industry, size',
        { id: organizationId }
      );

      // Fetch user profile for personalization
      const userProfileResponse = await selectData(
        'user_profiles',
        'display_name, first_name, role, job_title, preferences',
        { user_id: userId }
      );

      const profileData = userProfileResponse.success && userProfileResponse.data && userProfileResponse.data.length > 0
        ? userProfileResponse.data[0] as { display_name?: string; first_name?: string; role?: string; job_title?: string; preferences?: { communication_style?: string } }
        : null;

      return {
        thoughts: thoughtsResponse.success ? (thoughtsResponse.data as Array<{ id: string; title: string; content: string; created_at: string }>) : [],
        brainTickets: brainTicketsResponse.success ? (brainTicketsResponse.data as Array<{ id: string; title: string; description: string; status: string; created_at: string }>) : [],
        userContexts: userContextsResponse.success ? (userContextsResponse.data as Array<{ id: string; context_data: unknown; created_at: string }>) : [],
        companyData: companyResponse.success && companyResponse.data && companyResponse.data.length > 0 ? (companyResponse.data[0] as { name?: string; industry?: string; size?: string; tools?: string[] }) : {},
        userProfile: {
          name: profileData?.display_name || profileData?.first_name,
          role: profileData?.role || profileData?.job_title,
          preferences: profileData?.preferences?.communication_style
        }
      };
    } catch (error) {
      logger.error('Error loading client knowledgebase', { error });
      return {
        thoughts: [],
        brainTickets: [],
        userContexts: [],
        companyData: {},
        userProfile: {}
      };
    }
  }

  /**
   * Stream a message via Nexus AI Gateway
   * This replaces the old "rule-based" chat with real AI inference.
   */
  async streamMessage(
    message: string,
    context: ConversationContext,
    onToken: (token: string) => void,
    authToken: string,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
  ): Promise<void> {

    // 1. Build System Prompt with Semantic Search (falls back to keyword matching)
    const systemPrompt = await this.buildSystemPromptWithSemanticSearch(context, message, authToken);

    // 2. Build messages array with history (last 10 exchanges max to stay within context limits)
    const historyMessages = conversationHistory
      .slice(-20) // Last 20 messages (10 exchanges)
      .map(msg => ({ role: msg.role, content: msg.content }));

    // Add current user message
    const messages = [...historyMessages, { role: 'user' as const, content: message }];

    // 3. Call the AI Gateway
    try {
        const response = await fetch('/api/ai/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                messages,
                system: systemPrompt,
                stream: true,
                userId: context.userId
            })
        });

        if (!response.ok) {
             const errText = await response.text();
             throw new Error(`Gateway Error: ${response.status} ${errText}`);
        }
        
        if (!response.body) throw new Error('No response body');

        // 3. Read the Stream
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; 
            
            for (const line of lines) {
                if (line.trim() === '') continue;
                if (line.startsWith('data: ')) {
                    const dataStr = line.slice(6);
                    if (dataStr === '[DONE]') return;
                    try {
                        const data = JSON.parse(dataStr);
                        if (data.error) {
                            onToken(`\n[Error: ${data.error}]`);
                        } else if (data.content) {
                            onToken(data.content);
                        }
                    } catch (e) {
                         // ignore partial/invalid json
                    }
                }
            }
        }
    } catch (err) {
        logger.error('Stream failure', err);
        onToken(`\n[Connection Error: ${err instanceof Error ? err.message : 'Unknown'}]`);
    }
  }

  /**
   * Construct a rich system prompt using the client's knowledgebase
   * Note: This is the synchronous version using pre-loaded context.
   * For semantic search, use buildSystemPromptWithSemanticSearch instead.
   */
  private buildSystemPrompt(context: ConversationContext, userMessage: string): string {
    const kb = context.businessContext.knowledgeBase;
    const company = kb?.companyData;
    const userProfile = kb?.userProfile;

    let prompt = "You are Nexus, an advanced AI business operating system. You are helpful, professional, and deeply knowledgeable about the user's business.";

    // Add user profile context (from Knowledge page edits)
    if (userProfile && (userProfile.name || userProfile.role)) {
        prompt += "\n\nAbout the User:";
        if (userProfile.name) prompt += `\nName: ${userProfile.name}`;
        if (userProfile.role) prompt += `\nRole: ${userProfile.role}`;
        if (userProfile.preferences) prompt += `\nCommunication style: ${userProfile.preferences}`;
    }

    if (company && company.name) {
        prompt += `\n\nTarget Business: ${company.name}`;
        if (company.industry) prompt += `\nIndustry: ${company.industry}`;
        if (company.size) prompt += `\nSize: ${company.size}`;
    }

    if (kb?.thoughts && kb.thoughts.length > 0) {
        // Simple keyword matching for RAG context injection (fallback)
        const keywords = userMessage.toLowerCase().split(' ').filter(w => w.length > 4);
        const relevantThoughts = kb.thoughts.filter(t =>
            keywords.some(k => t.title.toLowerCase().includes(k) || t.content.toLowerCase().includes(k))
        ).slice(0, 3);

        if (relevantThoughts.length > 0) {
            prompt += "\n\nRelevant Business Context:";
            relevantThoughts.forEach(t => {
                prompt += `\n- [${t.title}]: ${t.content.substring(0, 200)}...`;
            });
        }
    }

    if (kb?.brainTickets && kb.brainTickets.length > 0) {
        const active = kb.brainTickets.filter(t => t.status === 'open').slice(0, 5);
        if (active.length > 0) {
            prompt += "\n\nActive Brain Tickets (Tasks):";
            active.forEach(t => {
                prompt += `\n- ${t.title}: ${t.description.substring(0, 100)}`;
            });
        }
    }

    return prompt;
  }

  /**
   * Fetch semantically relevant thoughts using vector search
   */
  private async fetchSemanticContext(
    query: string,
    authToken: string
  ): Promise<Array<{ title: string; content: string; similarity: number }>> {
    try {
      const response = await fetch('/api/vector/thoughts/semantic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          query,
          match_count: 5
        })
      });

      if (!response.ok) {
        logger.warn('Semantic search failed, will use keyword fallback');
        return [];
      }

      const result = await response.json();
      return result.success ? result.data : [];
    } catch (error) {
      logger.warn('Semantic search error, using fallback', { error });
      return [];
    }
  }

  /**
   * Build system prompt with semantic search results
   */
  async buildSystemPromptWithSemanticSearch(
    context: ConversationContext,
    userMessage: string,
    authToken: string
  ): Promise<string> {
    const kb = context.businessContext.knowledgeBase;
    const company = kb?.companyData;
    const userProfile = kb?.userProfile;

    let prompt = "You are Nexus, an advanced AI business operating system. You are helpful, professional, and deeply knowledgeable about the user's business.";

    // Add user profile context (from Knowledge page edits)
    if (userProfile && (userProfile.name || userProfile.role)) {
      prompt += "\n\nAbout the User:";
      if (userProfile.name) prompt += `\nName: ${userProfile.name}`;
      if (userProfile.role) prompt += `\nRole: ${userProfile.role}`;
      if (userProfile.preferences) prompt += `\nCommunication style: ${userProfile.preferences}`;
    }

    if (company && company.name) {
      prompt += `\n\nTarget Business: ${company.name}`;
      if (company.industry) prompt += `\nIndustry: ${company.industry}`;
      if (company.size) prompt += `\nSize: ${company.size}`;
    }

    // Use semantic search for relevant thoughts
    const semanticResults = await this.fetchSemanticContext(userMessage, authToken);

    if (semanticResults.length > 0) {
      prompt += "\n\nRelevant Business Context (semantic match):";
      semanticResults.slice(0, 3).forEach(t => {
        const similarity = Math.round((t.similarity || 0) * 100);
        prompt += `\n- [${t.title}] (${similarity}% match): ${t.content.substring(0, 250)}`;
      });
    } else if (kb?.thoughts && kb.thoughts.length > 0) {
      // Fallback to keyword matching if semantic search returns nothing
      const keywords = userMessage.toLowerCase().split(' ').filter(w => w.length > 4);
      const relevantThoughts = kb.thoughts.filter(t =>
        keywords.some(k => t.title.toLowerCase().includes(k) || t.content.toLowerCase().includes(k))
      ).slice(0, 3);

      if (relevantThoughts.length > 0) {
        prompt += "\n\nRelevant Business Context:";
        relevantThoughts.forEach(t => {
          prompt += `\n- [${t.title}]: ${t.content.substring(0, 200)}...`;
        });
      }
    }

    if (kb?.brainTickets && kb.brainTickets.length > 0) {
      const active = kb.brainTickets.filter(t => t.status === 'open').slice(0, 5);
      if (active.length > 0) {
        prompt += "\n\nActive Brain Tickets (Tasks):";
        active.forEach(t => {
          prompt += `\n- ${t.title}: ${t.description.substring(0, 100)}`;
        });
      }
    }

    return prompt;
  }
}

export const conversationalAIService = ConversationalAIService.getInstance();
