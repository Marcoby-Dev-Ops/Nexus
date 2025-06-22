import type { AgentResponse } from './types';
import type { Agent } from '@/lib/agentRegistry';

interface SupervisorMetadata {
  specialists?: Agent[];
  department?: string;
}

// Very lightweight intent-routing logic.
// 1. Look for keyword overlap between the user message and each specialist's `specialties` list.
// 2. Choose the specialist with the highest match-score (>=1 keyword) and return a suggestion.
// 3. Fallback to current departmental agent if no match.

export async function supervisorAgent(
  message: string,
  metadata: SupervisorMetadata = {}
): Promise<AgentResponse> {
  const txt = message.toLowerCase();
  const { specialists = [], department } = metadata;

  let bestMatch: Agent | null = null;
  let bestScore = 0;

  for (const spec of specialists) {
    const keywords = spec.specialties || [];
    const score = keywords.reduce((acc, kw) => {
      return txt.includes(kw.toLowerCase()) ? acc + 1 : acc;
    }, 0);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = spec;
    }
  }

  // Decide confidence: simple heuristic based on #keywords matched
  const confidence = Math.min(1, bestScore / 2); // 1+ matches → 0.5, 2+ → 1

  if (bestMatch && bestScore > 0) {
    return {
      content: `I believe ${bestMatch.name} can provide more specialized help on this topic. Would you like me to connect you?`,
      confidence,
      routeToAgentId: bestMatch.id,
      reasoning: `Matched ${bestScore} keyword${bestScore > 1 ? 's' : ''} with specialist expertise.`,
    };
  }

  // No strong specialist match — stay with department head
  return {
    content: `Let me handle that as your ${department ?? 'department'} assistant.`,
    confidence: 0.3,
  };
} 