import type { Tactic } from './tactics';
import type { ConvState } from './goalGraph';

export function selectTactic(
  tactics: Tactic[],
  s: ConvState
): Tactic {
  const candidates = tactics.filter(t => t.when(s));
  if (!candidates.length) {
    // safe default: reflect & ask small step
    return tactics.find(t => t.id === "reflect_back")!;
  }

  // Utility combines: progress gain, satisfaction, cost/length, pushiness penalty.
  const scored = candidates.map(t => {
    const u = t.utility(s);
    const pushyPenalty = (s.lastUserAct === "pushback" && ["ask_commitment"].includes(t.id)) ? 0.2 : 0;
    return { t, score: Math.max(0, u - pushyPenalty) };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0].t;
}

export function classifyUserAct(userUtterance: string): ConvState['lastUserAct'] {
  const text = userUtterance.toLowerCase();
  
  // Check for pushback indicators
  if (text.includes("i don't think") || text.includes("that won't work") || 
      text.includes("i'm not sure") || text.includes("but") || 
      text.includes("however") || text.includes("actually")) {
    return "pushback";
  }
  
  // Check for approval indicators
  if (text.includes("yes") || text.includes("sounds good") || text.includes("perfect") ||
      text.includes("that works") || text.includes("great") || text.includes("excellent")) {
    return "approval";
  }
  
  // Check for questions
  if (text.includes("?") || text.includes("how") || text.includes("what") || 
      text.includes("when") || text.includes("where") || text.includes("why")) {
    return "question";
  }
  
  // Check for off-topic indicators (simple heuristic)
  const offTopicKeywords = ["weather", "sports", "politics", "news", "movie", "music"];
  if (offTopicKeywords.some(keyword => text.includes(keyword))) {
    return "offtopic";
  }
  
  // Default to providing information
  return "provide_info";
}

export function ensureProgressOrPatch(
  assistantReply: string, 
  nextState: ConvState
): string {
  // Simple heuristic: if no goals were completed and reply is short, add a small step
  const goalsCompleted = nextState.goals.filter(g => g.complete).length;
  const previousGoalsCompleted = nextState.goals.length - 1; // Assuming one goal was just completed
  
  if (goalsCompleted <= previousGoalsCompleted && assistantReply.length < 100) {
    return `${assistantReply}\n\nWhat's the next small step you'd like to take?`;
  }
  
  return assistantReply;
}
