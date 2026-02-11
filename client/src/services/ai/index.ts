/**
 * AI Services Index
 * 
 * Exports all AI-related services for the AI domain.
 * 
 * Primary orchestrator: ConsolidatedAIService
 * Specialized services: SpeechService, MentalModelsService, NextBestActionService, ExpertKnowledgeService
 */

// Primary AI Orchestrator
export { ConsolidatedAIService } from './ConsolidatedAIService';

// Specialized AI Services
export { SpeechService } from './SpeechService';
export { MentalModelsService } from './MentalModelsService';
export { NextBestActionService } from './NextBestActionService';
export { expertKnowledgeService } from './ExpertKnowledgeService';
export { continuousImprovementService } from './ContinuousImprovementService';

// Legacy exports (deprecated - use ConsolidatedAIService instead)
export { AIService } from './AIService';
export { AIInsightsService } from './AIInsightsService';
export { aiFormAssistanceService } from './AIFormAssistanceService';
export { NexusUnifiedBrain } from './nexusUnifiedBrain';
export { MultiModalIntelligence } from './multiModalIntelligence';
// export { NexusAIGatewayService } from '@/ai/services/NexusAIGatewayService'; // Removed - server-side service

// Export types for AI Form Assistance
export type {
  FormAssistanceSession,
  FormSuggestion,
  FormAssistanceContext,
  FieldSuggestionRequest,
  FormCompletionResult
} from './AIFormAssistanceService';

// Export types from ConsolidatedAIService
export type {
  AIOperation,
  AIModel,
  AIConversation,
  Agent,
  AIRecommendation,
  FormAssistance
} from './ConsolidatedAIService';

// Export types from AIService
export type { SlashCommand } from './AIService';
