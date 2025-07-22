/**
 * AI Agents Subdomain
 * Handles all agent-related functionality including agent selection, departmental agents, and agent indicators
 */

// Agent Components
export { default as AgentPicker } from './components/AgentPicker';
export { DepartmentalAgent } from './components/DepartmentalAgent';
export { default as DomainAgentIndicator } from './components/DomainAgentIndicator';
export { MarcobyNexusAgent } from './components/MarcobyNexusAgent';
export { default as ExecutiveAssistant } from './components/ExecutiveAssistant';
export { ModernExecutiveAssistant } from './components/ModernExecutiveAssistant';
export { NexusAIController } from './components/NexusAIController';
export { N8nAssistantPanel } from './components/N8nAssistantPanel';

// Agent Types
export interface Agent {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  domain: 'general' | 'sales' | 'finance' | 'operations' | 'marketing' | 'hr' | 'it';
  priority: 'high' | 'medium' | 'low';
  enabled: boolean;
}

export interface AgentContext {
  userId: string;
  sessionId: string;
  domain: string;
  task: string;
  metadata?: Record<string, any>;
}

export interface AgentConfig {
  enableMultiAgent: boolean;
  enableDepartmentalAgents: boolean;
  enableAgentSwitching: boolean;
  maxConcurrentAgents: number;
  enableAgentMemory: boolean;
} 