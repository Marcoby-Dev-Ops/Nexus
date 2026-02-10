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

export interface ChatRuntimeOptions {
  agentId?: string;
  conversationId?: string;
}

export interface StreamRuntimeMetadata {
  contextInjected?: boolean;
  modelWay?: unknown;
  switchTarget?: string;
}

export interface StreamRuntimeStatus {
  stage: string;
  label: string;
  detail?: string | null;
  timestamp?: string;
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
    tools?: string[];
  };
  userProfile: {
    name?: string;
    role?: string;
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
      return this.handleError('Failed to initialize conversation context', String(error));
    }
  }

  /**
   * Load the client's complete knowledgebase
   */
  private async loadClientKnowledgeBase(userId: string, organizationId: string): Promise<ClientKnowledgeBase> {
    try {
      // Fixed table name: thoughts → personal_thoughts
      const thoughtsResponse = await selectData({
        table: 'personal_thoughts',
        columns: 'id, title, content, created_at',
        filters: { user_id: userId },
        limit: 10
      });

      // brain_tickets table doesn't exist - skip for now
      const brainTicketsResponse = { success: false, data: [] as never[] };

      // user_contexts table doesn't exist - skip for now
      const userContextsResponse = { success: false, data: [] as never[] };

      // Fixed columns: removed industry, size (don't exist)
      // Only query if organizationId is a valid UUID, skip if "default"
      let companyResponse: any = { success: false, data: [] as any[] };
      if (organizationId && organizationId !== 'default' && organizationId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        companyResponse = await selectData({
          table: 'companies',
          columns: 'name',
          filters: { id: organizationId }
        });
      }

      // Fetch user profile for personalization - removed job_title and preferences (don't exist)
      const userProfileResponse = await selectData(
        'user_profiles',
        'display_name, first_name, role',
        { user_id: userId }
      );

      const profileData = userProfileResponse.success && userProfileResponse.data && userProfileResponse.data.length > 0
        ? userProfileResponse.data[0] as { display_name?: string; first_name?: string; role?: string }
        : null;

      return {
        thoughts: thoughtsResponse.success ? (thoughtsResponse.data as Array<{ id: string; title: string; content: string; created_at: string }>) : [],
        brainTickets: brainTicketsResponse.success ? (brainTicketsResponse.data as Array<{ id: string; title: string; description: string; status: string; created_at: string }>) : [],
        userContexts: userContextsResponse.success ? (userContextsResponse.data as Array<{ id: string; context_data: unknown; created_at: string }>) : [],
        companyData: companyResponse.success && companyResponse.data && companyResponse.data.length > 0 ? (companyResponse.data[0] as { name?: string; tools?: string[] }) : {},
        userProfile: {
          name: profileData?.display_name || profileData?.first_name,
          role: profileData?.role
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
   * Stream a message via Nexus AI Gateway (pure proxy to OpenClaw)
   * OpenClaw's own soul/system docs handle AI personality and behavior.
   * Nexus only passes user messages — no system prompt override.
   */
  async streamMessage(
    message: string,
    context: ConversationContext,
    onToken: (token: string) => void,
    authToken: string,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [],
    runtime: ChatRuntimeOptions = {},
    onMetadata?: (metadata: StreamRuntimeMetadata) => void,
    onStatus?: (status: StreamRuntimeStatus) => void
  ): Promise<void> {

    // Build messages array with history (last 10 exchanges max to stay within context limits)
    const historyMessages = conversationHistory
      .slice(-20) // Last 20 messages (10 exchanges)
      .map(msg => ({ role: msg.role, content: msg.content }));

    // Add current user message
    const messages = [...historyMessages, { role: 'user' as const, content: message }];

    // Call the AI Gateway (pure proxy to OpenClaw)
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          messages,
          stream: true,
          userId: context.userId,
          conversationId: runtime.conversationId,
          agentId: runtime.agentId
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
              if (data?.metadata && onMetadata) {
                onMetadata(data.metadata as StreamRuntimeMetadata);
              }
              if (data?.status && onStatus) {
                onStatus(data.status as StreamRuntimeStatus);
              }
              if (data.error) {
                onToken(`\n[Error: ${data.error}]`);
              } else if (data.content) {
                onToken(data.content);
              }
            } catch {
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
}

export const conversationalAIService = ConversationalAIService.getInstance();
