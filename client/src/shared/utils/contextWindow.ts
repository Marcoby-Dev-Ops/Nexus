/**
 * Context Window Management Utility
 * Intelligently manages conversation context to stay within token limits
 */

import type { ChatMessage, ContextWindowConfig } from '../types/chat';

// Rough token estimation (4 characters ≈ 1 token)
const estimateTokens = (text: string): number => {
  return Math.ceil(text.length / 4);
};

// Default context window configuration
export const DEFAULT_CONTEXT_CONFIG: ContextWindowConfig = {
  maxTokens: 4000,
  maxMessages: 50,
  preserveSystemPrompt: true,
  truncationStrategy: 'smart'
};

/**
 * Smart context truncation that preserves important messages
 */
export const truncateContext = (
  messages: ChatMessage[],
  config: ContextWindowConfig = DEFAULT_CONTEXT_CONFIG
): ChatMessage[] => {
  if (messages.length <= config.maxMessages) {
    return messages;
  }

  let totalTokens = 0;
  const truncated: ChatMessage[] = [];
  const systemMessages: ChatMessage[] = [];
  const regularMessages: ChatMessage[] = [];

  // Separate system messages from regular messages
  messages.forEach(message => {
    if (message.role === 'system') {
      systemMessages.push(message);
    } else {
      regularMessages.push(message);
    }
  });

  // Always preserve system prompt if configured
  if (config.preserveSystemPrompt) {
    systemMessages.forEach(message => {
      const tokens = estimateTokens(message.content);
      if (totalTokens + tokens <= config.maxTokens) {
        truncated.push(message);
        totalTokens += tokens;
      }
    });
  }

  // Apply truncation strategy to regular messages
  switch (config.truncationStrategy) {
    case 'oldest':
      // Keep most recent messages
      for (let i = regularMessages.length - 1; i >= 0; i--) {
        const message = regularMessages[i];
        const tokens = estimateTokens(message.content);
        
        if (totalTokens + tokens > config.maxTokens) {
          break;
        }
        
        truncated.unshift(message);
        totalTokens += tokens;
      }
      break;

    case 'middle':
      // Keep first and last messages, remove middle
      const keepCount = Math.floor(config.maxMessages / 2);
      const firstMessages = regularMessages.slice(0, keepCount);
      const lastMessages = regularMessages.slice(-keepCount);
      
      [...firstMessages, ...lastMessages].forEach(message => {
        const tokens = estimateTokens(message.content);
        if (totalTokens + tokens <= config.maxTokens) {
          truncated.push(message);
          totalTokens += tokens;
        }
      });
      break;

    case 'smart':
    default:
      // Smart strategy: prioritize recent messages and user messages
      const weightedMessages = regularMessages.map((message, index) => ({
        message,
        weight: calculateMessageWeight(message, index, regularMessages.length)
      }));

      // Sort by weight (highest first)
      weightedMessages.sort((a, b) => b.weight - a.weight);

      // Add messages until token limit
      weightedMessages.forEach(({ message }) => {
        const tokens = estimateTokens(message.content);
        if (totalTokens + tokens <= config.maxTokens) {
          truncated.push(message);
          totalTokens += tokens;
        }
      });

      // Sort back by creation time
      truncated.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      break;
  }

  return truncated;
};

/**
 * Calculate message weight for smart truncation
 */
const calculateMessageWeight = (
  message: ChatMessage,
  index: number,
  totalMessages: number
): number => {
  let weight = 0;

  // Recency bonus (more recent = higher weight)
  const recencyFactor = (index + 1) / totalMessages;
  weight += recencyFactor * 0.4;

  // User message bonus (user messages are often more important)
  if (message.role === 'user') {
    weight += 0.3;
  }

  // Length bonus (longer messages might be more important)
  const lengthFactor = Math.min(message.content.length / 1000, 1);
  weight += lengthFactor * 0.2;

  // Error penalty (messages with errors are less important)
  if (message.metadata.error) {
    weight -= 0.5;
  }

  return weight;
};

/**
 * Get conversation summary for context preservation
 */
export const generateConversationSummary = (messages: ChatMessage[]): string => {
  const userMessages = messages
    .filter(m => m.role === 'user')
    .slice(-5) // Last 5 user messages
    .map(m => m.content)
    .join('\n');

  if (userMessages.length > 500) {
    return userMessages.substring(0, 500) + '...';
  }

  return userMessages;
};

/**
 * Check if conversation needs truncation
 */
export const needsTruncation = (
  messages: ChatMessage[],
  config: ContextWindowConfig = DEFAULT_CONTEXT_CONFIG
): boolean => {
  const totalTokens = messages.reduce((sum, message) => {
    return sum + estimateTokens(message.content);
  }, 0);

  return totalTokens > config.maxTokens || messages.length > config.maxMessages;
};

/**
 * Get conversation statistics
 */
export const getConversationStats = (messages: ChatMessage[]) => {
  const totalTokens = messages.reduce((sum, message) => {
    return sum + estimateTokens(message.content);
  }, 0);

  const userMessages = messages.filter(m => m.role === 'user').length;
  const assistantMessages = messages.filter(m => m.role === 'assistant').length;
  const systemMessages = messages.filter(m => m.role === 'system').length;

  return {
    totalMessages: messages.length,
    totalTokens,
    userMessages,
    assistantMessages,
    systemMessages,
    averageTokensPerMessage: Math.round(totalTokens / messages.length) || 0
  };
};
