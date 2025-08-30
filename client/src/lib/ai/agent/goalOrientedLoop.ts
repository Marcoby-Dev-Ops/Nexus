import type { ConvState, PersonaPolicy } from '../policy/goalGraph';
import type { Tactic } from '../policy/tactics';
import { selectTactic, classifyUserAct, ensureProgressOrPatch } from '../policy/selectTactic';
import { incompleteGoals } from '../policy/goalGraph';
import { logger } from '@/shared/utils/logger';

export interface GoalTurnInput {
  conv: ConvState;
  userUtterance: string;
  context: string;              // retrieval/context packer output
  personaPolicy: PersonaPolicy; // the JSON policy
  llm: (args: { system: string; user: string }) => Promise<string>;
  tacticLib: Tactic[];
}

export interface GoalTurnResult {
  message: string;
  state: ConvState;
  tactic: string;
  goalProgress: Record<string, { complete: boolean; evidence: Record<string, any> }>;
}

export async function goalTurn(input: GoalTurnInput): Promise<GoalTurnResult> {
  try {
    // 1) classify user act quickly (cheap LLM or rules)
    input.conv.lastUserAct = classifyUserAct(input.userUtterance);

    // 2) choose tactic
    const tactic = selectTactic(input.tacticLib, input.conv);
    const { systemHint, userPrompt } = tactic.enact(input.conv);

    // 3) build a focused system message:
    const system = [
      `Mission: ${input.personaPolicy.mission}`,
      `Current goals: ${incompleteGoals(input.conv).join(", ")}`,
      `You must perform tactic: ${tactic.id} — ${systemHint}.`,
      `Tone: concise, direct, supportive; avoid pushiness.`,
      `If user detours, acknowledge once, then gently tie back to goals.`
    ].join("\n");

    // 4) get the model response
    const assistant = await input.llm({
      system,
      user: `${userPrompt}\n\nUser: ${input.userUtterance}\n\nContext:\n${input.context}`
    });

    // 5) update state with the reply content (extract intent, constraints, plans, commitments)
    const nextState = tactic.apply(input.conv, assistant);

    // 6) light critic: if reply lacks progress/evidence → add a one-sentence addendum or propose a small step
    const fixedAssistant = ensureProgressOrPatch(assistant, nextState);

    // 7) calculate goal progress for UI
    const goalProgress = nextState.goals.reduce((acc, goal) => {
      acc[goal.id] = {
        complete: goal.complete,
        evidence: goal.evidence
      };
      return acc;
    }, {} as Record<string, { complete: boolean; evidence: Record<string, any> }>);

    return { 
      message: fixedAssistant, 
      state: nextState, 
      tactic: tactic.id,
      goalProgress
    };
  } catch (error) {
    logger.error({ error }, 'Error in goalTurn');
    
    // Fallback response
    return {
      message: "I'm having trouble processing that right now. Could you rephrase your request?",
      state: input.conv,
      tactic: "reflect_back",
      goalProgress: input.conv.goals.reduce((acc, goal) => {
        acc[goal.id] = {
          complete: goal.complete,
          evidence: goal.evidence
        };
        return acc;
      }, {} as Record<string, { complete: boolean; evidence: Record<string, any> }>)
    };
  }
}

export function createGoalOrientedChat(
  personaPolicy: PersonaPolicy,
  tacticLib: Tactic[],
  llm: (args: { system: string; user: string }) => Promise<string>
) {
  let convState = {
    goals: personaPolicy.default_goals.map(goal => ({
      id: goal.id,
      complete: false,
      evidence: {}
    })),
    detoursUsed: 0,
    satisfaction: 0.7
  };

  return {
    async sendMessage(userUtterance: string, context: string = ""): Promise<GoalTurnResult> {
      const result = await goalTurn({
        conv: convState,
        userUtterance,
        context,
        personaPolicy,
        llm,
        tacticLib
      });
      
      convState = result.state;
      return result;
    },

    getState(): ConvState {
      return convState;
    },

    reset(): void {
      convState = {
        goals: personaPolicy.default_goals.map(goal => ({
          id: goal.id,
          complete: false,
          evidence: {}
        })),
        detoursUsed: 0,
        satisfaction: 0.7
      };
    }
  };
}
