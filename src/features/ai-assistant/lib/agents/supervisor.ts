import type { AgentResponse } from './types';

// Supervisor agent: routes user messages to appropriate specialist agents
export async function supervisorAgent(
  message: string,
  metadata?: Record<string, any>
): Promise<AgentResponse> {
  // TODO: implement intent parsing and agent routing logic
  return {
    content: `Supervisor received: ${message}`,
    confidence: 1.0
  };
} 