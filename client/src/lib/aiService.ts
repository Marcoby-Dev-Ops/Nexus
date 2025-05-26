/**
 * aiService.ts
 * Service for interacting with the OpenRouter API for chat completions and RAG.
 * Replace 'YOUR_OPENROUTER_API_KEY' with your actual API key.
 */
import axios from 'axios';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatCompletionOptions {
  messages: ChatMessage[];
  context?: string; // For RAG: additional context to inject
  model?: string; // Optional: specify model (e.g., 'openai/gpt-4')
}

export interface Usage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  [key: string]: number;
}

export interface ChatCompletionResponse {
  content: string;
  usage?: Usage;
}

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY as string;
if (!OPENROUTER_API_KEY) {
  throw new Error('OpenRouter API key is not set. Please add VITE_OPENROUTER_API_KEY to your .env file.');
}

/**
 * Sends a chat completion request to OpenRouter.
 * @param {ChatCompletionOptions} options - The chat and context options.
 * @returns {Promise<ChatCompletionResponse>} The assistant's response.
 */
export async function getChatCompletion(options: ChatCompletionOptions): Promise<ChatCompletionResponse> {
  try {
    const { messages, context, model = 'openai/gpt-4' } = options;
    // Optionally inject context for RAG
    const finalMessages = context
      ? [
          { role: 'system', content: `Context: ${context}` },
          ...messages,
        ]
      : messages;
    const response = await axios.post(
      OPENROUTER_API_URL,
      {
        model,
        messages: finalMessages,
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    type OpenRouterResponse = {
      choices: { message: { content: string } }[];
      usage?: Usage;
    };
    const data = response.data as OpenRouterResponse;
    const content = data.choices?.[0]?.message?.content || '';
    return { content, usage: data.usage };
  } catch (error: unknown) {
    if (
      error &&
      typeof error === 'object' &&
      'isAxiosError' in error &&
      (error as any).isAxiosError
    ) {
      const axiosError = error as { response?: { data?: { error?: { message?: string } } }; message?: string };
      throw new Error(axiosError.response?.data?.error?.message || axiosError.message || 'AI request failed');
    }
    throw new Error('AI request failed');
  }
} 