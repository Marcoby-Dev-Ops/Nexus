import { callEdgeFunction } from '@/lib/api-client';
import { vectorSearch } from '@/lib/database/vectorSearch';
import { thoughtsService } from '@/lib/services/thoughtsService';
import { logger } from '@/shared/utils/logger';
import type { CreateThoughtRequest, ThoughtCategory } from '@/core/types/thoughts';

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string | number;
}

export interface SummarizerResult {
  summaryText: string;
  title?: string;
  tags?: string[];
  suggestedAction?: string;
  raw?: any;
}

class ConversationSummarizer {
  /** Build a prompt that asks the AI to summarize the recent conversation and propose a thought title/tags/action */
  buildSummarizationPrompt(messages: ConversationMessage[], context?: Record<string, any>): string {
    const convo = messages
      .slice(-12) // limit length
      .map(m => `${m.role.toUpperCase()}: ${m.content}`)
      .join('\n');

    const business = context?.businessContext ? `Business context: ${JSON.stringify(context.businessContext)}\n` : '';

    return `${business}You are Nexus. Given the recent conversation below, produce:
1) A concise summary (1-3 sentences)
2) A short title suitable for saving as a "thought" (max 8 words)
3) Up to 5 tags (comma-separated)
4) A suggested next action the user could take (one short sentence)

Return a JSON object only with keys: summary, title, tags (array), action

Conversation:\n${convo}`;
  }

  /** Call the chat edge function to get the summary */
  async summarize(messages: ConversationMessage[], context?: Record<string, any>): Promise<SummarizerResult> {
    try {
      const prompt = this.buildSummarizationPrompt(messages, context);

      const response = await callEdgeFunction('chat', {
        message: prompt,
        systemPrompt: 'You are a concise summarization assistant. Output only JSON.',
        metadata: { purpose: 'conversation_summarizer' }
      });

      if (!response.success) {
        logger.error('Summarizer edge call failed', response.error);
        throw new Error(response.error || 'Summarizer failed');
      }

      const raw = response.data?.response || response.data;
      // Try to extract JSON from the assistant output
      const text = typeof raw === 'string' ? raw : JSON.stringify(raw);

      let parsed: any = null;
      try {
        parsed = JSON.parse(text);
      } catch (_) {
        // Attempt to find JSON substring
        const jsonMatch = text.match(/\{[\s\S]*\}/m);
        if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
      }

      const summaryText = parsed?.summary || parsed?.summaryText || (typeof raw === 'string' ? raw : JSON.stringify(raw));
      const title = parsed?.title || parsed?.name || undefined;
      const tags = Array.isArray(parsed?.tags) ? parsed.tags : (parsed?.tags ? String(parsed.tags).split(',').map((t: string) => t.trim()) : []);
      const suggestedAction = parsed?.action || parsed?.suggestedAction || undefined;

      return { summaryText, title, tags, suggestedAction, raw };
    } catch (error) {
      logger.error('Error in summarizer.summarize', { error });
      throw error;
    }
  }

  /** Persist a thought using both the vector insertion and the canonical thoughts service */
  async saveThought(params: {
    user_id: string;
    title: string;
    content: string;
    tags?: string[];
    category?: ThoughtCategory;
    company_id?: string;
    metadata?: Record<string, any>;
  }): Promise<{ success: boolean; id?: string; error?: any }> {
    try {
      // Insert into vector store (edge function will handle embeddings)
      const vec = await vectorSearch.insertThoughtWithEmbedding({
        title: params.title,
        content: params.content,
        user_id: params.user_id,
        company_id: params.company_id,
        category: params.category,
        tags: params.tags,
        metadata: params.metadata
      });

      // Also create the canonical thought record
      const createPayload: CreateThoughtRequest = {
        content: params.content,
        category: params.category || 'idea',
        company_id: params.company_id,
        interaction_method: 'text',
        ai_clarification_data: params.metadata,
      };

      const created = await thoughtsService.createThought({
        ...createPayload,
        user_id: params.user_id,
        // some services expect title/tags in metadata or aiinsights
        tags: params.tags,
        aiinsights: { createdBy: 'summarizer', title: params.title }
      } as any);

      const id = created.data?.id || vec.id;
      return { success: true, id };
    } catch (error) {
      logger.error('Error saving thought', { error });
      return { success: false, error };
    }
  }
}

export const conversationSummarizer = new ConversationSummarizer();
