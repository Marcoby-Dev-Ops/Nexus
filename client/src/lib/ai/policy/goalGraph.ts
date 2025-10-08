export type GoalId = "diagnose_intent" | "improve_clarity" | "propose_plan" | "secure_commit";

export interface GoalState {
  id: GoalId;
  complete: boolean;
  evidence: Record<string, any>; // e.g., {intent, constraints, plan, commitment}
}

export interface ConvState {
  goals: GoalState[];
  detoursUsed: number;
  lastUserAct?: "question" | "pushback" | "approval" | "offtopic" | "provide_info";
  satisfaction?: number; // quick sentiment/LLM rubric 0-1
}

export interface PersonaPolicy {
  id: string;
  mission: string;
  core_outcomes: string[];
  default_goals: Array<{ id: GoalId; desc: string }>;
  tone: {
    concise: boolean;
    direct: boolean;
    supportive: boolean;
    pushy: boolean;
  };
  flex_rules: {
    respect_user_lead: boolean;
    detour_budget_turns: number;
    never_block_user: boolean;
  };
}

export function createInitialConvState(policy: PersonaPolicy): ConvState {
  return {
    goals: policy.default_goals.map(goal => ({
      id: goal.id,
      complete: false,
      evidence: {}
    })),
    detoursUsed: 0,
    satisfaction: 0.7 // default neutral satisfaction
  };
}

export function incompleteGoals(state: ConvState): GoalId[] {
  return state.goals
    .filter(goal => !goal.complete)
    .map(goal => goal.id);
}

export function getGoalProgress(state: ConvState): Record<GoalId, { complete: boolean; evidence: Record<string, any> }> {
  const progress: Record<GoalId, { complete: boolean; evidence: Record<string, any> }> = {} as any;
  state.goals.forEach(goal => {
    progress[goal.id] = {
      complete: goal.complete,
      evidence: goal.evidence
    };
  });
  return progress;
}
