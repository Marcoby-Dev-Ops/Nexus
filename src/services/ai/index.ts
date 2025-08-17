/**
 * AI Services Index
 * 
 * Exports all AI-related services for the AI domain.
 */

// Core AI Services
export { AIService } from './AIService';
export { EmailIntelligenceService } from './emailIntelligenceService';
export { NexusUnifiedBrain } from './nexusUnifiedBrain';
export { MultiModalIntelligence } from './multiModalIntelligence';
// Deprecated: prefer routing via AIGateway
// export { ModelManager } from './modelManager';
export { NexusAIGatewayService } from '@/ai/services/NexusAIGatewayService';
export { CrossDepartmentalContext } from './crossDepartmentalContext';
export { ContextualDataCompletionService } from './contextualDataCompletionService';
export { AIAgentWithTools } from './aiAgentWithTools';
