import type { Tactic } from './tactics';
import type { ConvState } from './goalGraph';

// Helper function to clone state
function clone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

// Simple extractors (in production, these would use LLM calls)
function extractIntent(text: string): string | null {
  const intentPatterns = [
    /(?:I want to|I need to|I'm trying to|My goal is|I want)\s+(.+?)(?:\.|$)/i,
    /(?:help me|can you help|I need help)\s+(.+?)(?:\.|$)/i
  ];
  
  for (const pattern of intentPatterns) {
    const match = text.match(pattern);
    if (match) return match[1].trim();
  }
  return null;
}

function extractConstraints(text: string): Record<string, any> {
  const constraints: Record<string, any> = {};
  
  // Extract deadlines
  const deadlineMatch = text.match(/(?:by|before|until|deadline|due)\s+([^.,]+)/i);
  if (deadlineMatch) constraints.deadline = deadlineMatch[1].trim();
  
  // Extract budget mentions
  const budgetMatch = text.match(/(?:budget|cost|spend|invest)\s+(?:of|up to|around)\s+([^.,]+)/i);
  if (budgetMatch) constraints.budget = budgetMatch[1].trim();
  
  // Extract team size
  const teamMatch = text.match(/(?:team|staff|people|employees)\s+(?:of|with|size)\s+([^.,]+)/i);
  if (teamMatch) constraints.teamSize = teamMatch[1].trim();
  
  return constraints;
}

function extractPlan(text: string): string | null {
  const planPatterns = [
    /(?:plan|approach|strategy|steps?|process).*?:\s*(.+?)(?:\n|$)/is,
    /(?:here's|here is|the plan|my recommendation).*?:\s*(.+?)(?:\n|$)/is
  ];
  
  for (const pattern of planPatterns) {
    const match = text.match(pattern);
    if (match) return match[1].trim();
  }
  return null;
}

function extractCommitment(text: string): { owner: string; step: string; when: string } | null {
  const commitmentPatterns = [
    /(?:I will|I'll|I can|I'm going to)\s+(.+?)\s+(?:by|on|before)\s+(.+)/i,
    /(?:commit to|agree to)\s+(.+?)\s+(?:by|on|before)\s+(.+)/i
  ];
  
  for (const pattern of commitmentPatterns) {
    const match = text.match(pattern);
    if (match) {
      return {
        owner: "user",
        step: match[1].trim(),
        when: match[2].trim()
      };
    }
  }
  return null;
}

export const ask_intent: Tactic = {
  id: "ask_intent",
  when: (s) => !s.goals.find(g => g.id === "diagnose_intent")?.complete,
  utility: () => 0.9,
  enact: () => ({
    systemHint: "Elicit user's objective and success criteria in ≤2 lines",
    userPrompt: "Briefly: what outcome do you want? Any deadlines, constraints, or must-haves?"
  }),
  apply: (s, reply) => {
    const intent = extractIntent(reply);
    const constraints = extractConstraints(reply);
    const next = clone(s);
    const g = next.goals.find(g => g.id === "diagnose_intent")!;
    if (intent) {
      g.evidence.intent = intent;
      g.evidence.constraints = constraints || {};
      g.complete = true;
    }
    return next;
  }
};

export const reflect_back: Tactic = {
  id: "reflect_back",
  when: () => true, // Always available as fallback
  utility: () => 0.6,
  enact: () => ({
    systemHint: "Reflect back what you heard and ask for clarification if needed",
    userPrompt: "Let me make sure I understand. You're saying..."
  }),
  apply: (s, reply) => {
    // This tactic doesn't directly advance goals, but helps build understanding
    return s;
  }
};

export const summarize_constraints: Tactic = {
  id: "summarize_constraints",
  when: (s) => {
    const intentGoal = s.goals.find(g => g.id === "diagnose_intent");
    return intentGoal?.complete && Object.keys(intentGoal.evidence.constraints || {}).length > 0;
  },
  utility: () => 0.7,
  enact: () => ({
    systemHint: "Summarize the constraints and confirm understanding",
    userPrompt: "Based on what you've shared, here are the key constraints I see..."
  }),
  apply: (s, reply) => {
    const next = clone(s);
    const g = next.goals.find(g => g.id === "improve_clarity")!;
    g.evidence.constraintsSummary = "Constraints confirmed";
    g.complete = true;
    return next;
  }
};

export const propose_plan: Tactic = {
  id: "propose_plan",
  when: (s) => {
    const d = s.goals.find(g => g.id === "diagnose_intent")?.complete;
    const i = s.goals.find(g => g.id === "improve_clarity")?.complete ?? true;
    const p = s.goals.find(g => g.id === "propose_plan")?.complete;
    return d && i && !p;
  },
  utility: (s) => 0.85 * (s.satisfaction ?? 0.7),
  enact: () => ({
    systemHint: "Propose a minimal, high-leverage plan using FIRE (≤120 words)",
    userPrompt: "Here's a concise plan. I'll show steps, tradeoffs, and a safe default."
  }),
  apply: (s, reply) => {
    const next = clone(s);
    const g = next.goals.find(g => g.id === "propose_plan")!;
    g.evidence.plan = extractPlan(reply);
    g.complete = !!g.evidence.plan;
    return next;
  }
};

export const offer_alternatives: Tactic = {
  id: "offer_alternatives",
  when: (s) => s.lastUserAct === "pushback",
  utility: () => 0.8,
  enact: () => ({
    systemHint: "Offer 2-3 alternative approaches to address user concerns",
    userPrompt: "I understand your concern. Here are some alternative approaches..."
  }),
  apply: (s, reply) => {
    const next = clone(s);
    next.satisfaction = Math.min(1, (next.satisfaction ?? 0.7) + 0.1);
    return next;
  }
};

export const ask_commitment: Tactic = {
  id: "ask_commitment",
  when: (s) => {
    const p = s.goals.find(g => g.id === "propose_plan")?.complete;
    const c = s.goals.find(g => g.id === "secure_commit")?.complete;
    return p && !c;
  },
  utility: () => 0.75,
  enact: () => ({
    systemHint: "Invite a small, reversible commitment (owner + timebox)",
    userPrompt: "Want me to lock the first step now? (Owner + when). I'll also prep a checklist."
  }),
  apply: (s, reply) => {
    const next = clone(s);
    const g = next.goals.find(g => g.id === "secure_commit")!;
    const commit = extractCommitment(reply);
    if (commit) {
      g.evidence.commitment = commit;
      g.complete = true;
    }
    return next;
  }
};

export const handle_pushback: Tactic = {
  id: "handle_pushback",
  when: (s) => s.lastUserAct === "pushback",
  utility: () => 0.7,
  enact: () => ({
    systemHint: "Acknowledge the pushback and explore the underlying concern",
    userPrompt: "I hear your concern. Let's explore what's behind that..."
  }),
  apply: (s, reply) => {
    const next = clone(s);
    next.satisfaction = Math.max(0, (next.satisfaction ?? 0.7) - 0.1);
    return next;
  }
};

export const allow_detour: Tactic = {
  id: "allow_detour",
  when: (s) => s.lastUserAct === "offtopic" && s.detoursUsed < 3,
  utility: () => 0.5,
  enact: () => ({
    systemHint: "Briefly engage with the detour, then gently return to goals",
    userPrompt: "That's interesting. Let me address that briefly, then we can return to..."
  }),
  apply: (s, reply) => {
    const next = clone(s);
    next.detoursUsed += 1;
    return next;
  }
};

export const return_to_goal: Tactic = {
  id: "return_to_goal",
  when: (s) => s.detoursUsed > 0 && s.lastUserAct === "offtopic",
  utility: () => 0.6,
  enact: () => ({
    systemHint: "Gently redirect conversation back to the main objective",
    userPrompt: "That's helpful context. Now, let's get back to your main goal..."
  }),
  apply: (s, reply) => {
    const next = clone(s);
    next.detoursUsed = Math.max(0, next.detoursUsed - 1);
    return next;
  }
};

export const allTactics: Tactic[] = [
  ask_intent,
  reflect_back,
  summarize_constraints,
  propose_plan,
  offer_alternatives,
  ask_commitment,
  handle_pushback,
  allow_detour,
  return_to_goal
];
