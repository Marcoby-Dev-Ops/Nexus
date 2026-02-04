// COMPATIBILITY STUB - DIRECT OPENAI INTEGRATION REMOVED
// All AI traffic now routes through the Nexus AI Gateway via ConversationalAIService.

import { BaseService } from '@/core/services/BaseService';
import type { ServiceResponse } from '@/core/services/BaseService';

export class OpenAIService extends BaseService {
  private static instance: OpenAIService;

  public static getInstance(): OpenAIService {
    if (!OpenAIService.instance) {
      OpenAIService.instance = new OpenAIService();
    }
    return OpenAIService.instance;
  }

  // --- Legacy Config Methods (No-ops) ---
  getProvider() { return 'nexus-gateway'; }
  setProvider() { /* no-op */ }
  getAvailableModels() { return [{id: 'nexus-v1', name: 'Nexus AI (Managed)'}]; }
  getRecommendedModel() { return 'nexus-v1'; }

  // --- Legacy Generation Methods ---
  
  async generateIdentityContent(section: string, context: any, prompt: string, userId: string): Promise<ServiceResponse<any>> {
      return this.handleError('Direct AI generation is deprecated. Please use the Chat interface.');
  }

  async validateContent(content: string, type: string): Promise<ServiceResponse<any>> {
      return this.createResponse({ valid: true, feedback: 'Validation disabled in legacy service.' });
  }

  async generateResponse(prompt: string, context: any): Promise<ServiceResponse<any>> {
      return this.handleError('Direct response generation is deprecated.');
  }
}

export const openAIService = OpenAIService.getInstance();
