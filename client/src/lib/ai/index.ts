/**
 * Consolidated AI Module
 * 
 * Single source of truth for all AI functionality in Nexus
 */

// Core AI Services
export { agentRegistry, getAgent, getAllAgents, getAgentsByType, getAgentsByDepartment } from './core/agentRegistry';
export { ContextualRAG, contextualRAG } from './core/contextualRAG';
export { enhancedChatService } from './core/enhancedChatService';
export { unifiedBrain } from './core/unifiedBrain';
export { enhancedMemoryService } from './core/enhancedMemoryService';

// Business Logic Services
export { conversationRouter } from './services/conversationRouter';
export { defaultAgentService } from './services/defaultAgentService';
export { domainAgentService } from './services/domainAgentService';

// React Hooks
export { useDefaultAgent } from './hooks/useDefaultAgent';
export { useProductionChat } from './hooks/useProductionChat';

// Core Components
export { default as ModernChatInterface } from './components/ModernChatInterface';
export { default as DomainAgentChat } from './components/DomainAgentChat';
export { default as UserKnowledgeViewer } from './components/UserKnowledgeViewer';
export { default as ModernStreamingComposer } from './components/ModernStreamingComposer';

// AI Interface Components
export { default as ChatInput } from './components/ChatInput';
export { default as ConversationList } from './components/ConversationList';
// SimpleChatInterface removed (unused) — kept out of exports to avoid dead API surface
export { default as ChatMessage } from './components/ChatMessage';
export { default as ChatWelcome } from './components/ChatWelcome';
export { default as TransparencyDisplay } from './components/TransparencyDisplay';

// AI Brain Components
export { default as UnifiedBusinessBrain } from './components/UnifiedBusinessBrain';
export { default as ProgressiveIntelligence } from './components/ProgressiveIntelligence';
export { default as WowMomentOrchestrator } from './components/WowMomentOrchestrator';
export { default as BusinessLearningInterface } from './components/BusinessLearningInterface';
export { default as BrainAnalysis } from './components/BrainAnalysis';

// AI Demo Components
export { default as AdvancedAICapabilitiesDemo } from './components/AdvancedAICapabilitiesDemo';
export { default as CrossPlatformIntelligenceDemo } from './components/CrossPlatformIntelligenceDemo';
export { default as ModelPerformanceMonitor } from './components/ModelPerformanceMonitor';
export { default as ContinuousImprovementDashboard } from './components/ContinuousImprovementDashboard';
export { default as ExpertAdvice } from './components/ExpertAdvice';

// Chat Components
export { QuickChatTrigger } from './components/chat';

// Types
export type { 
  ChatAgent, 
  AgentType, 
  Department, 
  ExpertiseLevel,
  AgentPersonality,
  BaseAgent,
  DepartmentalAgent,
  ExecutiveAgent,
  SpecialistAgent
} from './types/types';

// Legacy exports for backward compatibility
export { getAgent as getAgentLegacy } from './core/agentRegistry';
