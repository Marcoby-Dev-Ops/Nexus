import type { ConvState } from './goalGraph';

export type TacticId =
  | "ask_intent"
  | "reflect_back"
  | "summarize_constraints"
  | "propose_plan"
  | "offer_alternatives"
  | "ask_commitment"
  | "handle_pushback"
  | "allow_detour"
  | "return_to_goal";

export interface Tactic {
  id: TacticId;
  when: (s: ConvState) => boolean;            // preconditions
  utility: (s: ConvState) => number;          // estimated value (0-1)
  enact: (s: ConvState) => { systemHint: string; userPrompt: string };
  apply: (s: ConvState, userReply: string) => ConvState; // state update after reply is parsed
}

export interface TacticResult {
  tactic: TacticId;
  systemHint: string;
  userPrompt: string;
  utility: number;
}
