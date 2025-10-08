import type { ChatAgent } from './core/agentRegistry';

// Reuse the existing ChatAgent definition from the agent registry so
// the `Agent` type here stays compatible with the registry and concrete
// agent implementations.
export type Agent = ChatAgent;

export type RoutingDecision = {
  agentId: string;
  confidence: number; // 0.0 - 1.0
  reasoning?: string;
  shouldRoute: boolean;
  context?: string;
};

export type UserContext = {
  userId?: string | number;
  businessType?: string;
  goals?: string[];
  currentChallenges?: string[];
  [k: string]: any;
};

export type RoutingSuggestion = {
  agentId: string;
  confidence: number;
  reasoning: string;
};

// Use named exports only to avoid default-exporting a type which can
// conflict with certain TypeScript emit settings.
// Barrel wrapper so imports can use './types' or './types.ts'
export * from './types';
