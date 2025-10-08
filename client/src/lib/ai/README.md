# Goal-Oriented AI System for Nexus

This system implements a **goal-oriented personality** for AI agents that maintains a clear mission while flexibly adapting to user needs. The bot has a personality with purpose, pursues specific goals, and still flexes to user direction.

## 🎯 Core Concept

Instead of just styling tone, this system gives the AI:
1. **Mission** - Why it exists
2. **Goals** - What it tries to achieve in each session  
3. **Tactics** - How it moves conversations forward
4. **Policy** - How it decides what to do when users zig-zag

## 🏗️ Architecture

### 1. Persona Policy (`config/personas/marcoby-goal-policy.json`)
Defines the AI's mission, goals, tone, and flex rules:

```json
{
  "id": "marcoby-nexus-advisor-v1",
  "mission": "Help SMB operators make confident, high-leverage decisions using Nexus.",
  "default_goals": [
    { "id": "diagnose_intent", "desc": "Understand user's objective and constraints" },
    { "id": "improve_clarity", "desc": "Transform vague asks into precise tasks" },
    { "id": "propose_plan", "desc": "Offer a concise plan with tradeoffs" },
    { "id": "secure_commit", "desc": "Obtain/record a next step with owner + timebox" }
  ],
  "flex_rules": {
    "respect_user_lead": true,
    "detour_budget_turns": 3,
    "never_block_user": true
  }
}
```

### 2. Goal Graph (`policy/goalGraph.ts`)
Tracks conversation state and goal progress:

```typescript
interface ConvState {
  goals: GoalState[];
  detoursUsed: number;
  lastUserAct?: "question" | "pushback" | "approval" | "offtopic";
  satisfaction?: number;
}
```

### 3. Tactics (`policy/tactics.ts` & `policy/tactic.impl.ts`)
Define how the AI advances through goals:

- `ask_intent` - Elicit user's objective
- `propose_plan` - Offer actionable plan
- `ask_commitment` - Secure next steps
- `handle_pushback` - Address concerns
- `allow_detour` - Briefly engage off-topic
- `return_to_goal` - Gently redirect back

### 4. Tactic Selection (`policy/selectTactic.ts`)
Utility function that scores and selects the best tactic based on:
- Progress gain
- User satisfaction
- Pushiness penalty
- Detour budget

### 5. Goal-Oriented Loop (`agent/goalOrientedLoop.ts`)
Main conversation loop that:
1. Classifies user's act
2. Selects best tactic
3. Builds focused system prompt
4. Gets LLM response
5. Updates conversation state
6. Ensures progress

## 🚀 Usage

### Basic Usage

```typescript
import { GoalOrientedChat } from '@/ai/components/GoalOrientedChat';

function MyPage() {
  return (
    <GoalOrientedChat 
      tenantId="your-tenant-id"
      userId="user-123"
      conversationId="conv-456"
    />
  );
}
```

### Advanced Usage with Hook

```typescript
import { useGoalOrientedAI } from '@/ai/hooks/useGoalOrientedAI';

function MyComponent() {
  const {
    messages,
    goalProgress,
    currentGoals,
    satisfaction,
    loading,
    sendMessage,
    resetConversation
  } = useGoalOrientedAI('tenant-id', 'user-id', 'conversation-id');

  const handleSend = async () => {
    await sendMessage("I want to improve my sales process");
  };

  return (
    <div>
      {/* Your custom UI */}
      <button onClick={handleSend} disabled={loading}>
        Send Message
      </button>
    </div>
  );
}
```

### Service Integration

```typescript
import { GoalOrientedAIService } from '@/ai/services/GoalOrientedAIService';

const service = new GoalOrientedAIService();

const response = await service.chat({
  message: "I need help with sales strategy",
  tenantId: "tenant-123",
  userId: "user-456"
});

console.log(response.data.tactic); // "ask_intent"
console.log(response.data.goalProgress); // Goal completion status
```

## 🎨 UI Features

The `GoalOrientedChat` component provides:

- **Progress Bar** - Visual goal completion tracking
- **Goal Chips** - Show which goals are complete/incomplete
- **Tactic Transparency** - Shows which tactic the AI is using
- **Satisfaction Indicator** - User satisfaction tracking
- **Steering Controls** - Hide/show steering, pause/resume
- **Reset Button** - Start fresh conversation

## 🔧 Customization

### Adding New Goals

1. Update `goalGraph.ts`:
```typescript
export type GoalId = "diagnose_intent" | "improve_clarity" | "propose_plan" | "secure_commit" | "your_new_goal";
```

2. Update persona policy:
```json
{
  "default_goals": [
    // ... existing goals
    { "id": "your_new_goal", "desc": "Your goal description" }
  ]
}
```

3. Create new tactic in `tactic.impl.ts`:
```typescript
export const your_new_tactic: Tactic = {
  id: "your_new_tactic",
  when: (s) => /* preconditions */,
  utility: (s) => 0.8,
  enact: () => ({
    systemHint: "What the AI should do",
    userPrompt: "How to frame the response"
  }),
  apply: (s, reply) => {
    // Update conversation state
    return nextState;
  }
};
```

### Customizing Persona

Edit `config/personas/marcoby-goal-policy.json`:

```json
{
  "mission": "Your custom mission",
  "tone": {
    "concise": true,
    "direct": false,
    "supportive": true,
    "pushy": false
  },
  "flex_rules": {
    "detour_budget_turns": 5,
    "respect_user_lead": true
  }
}
```

## 🧪 Testing

Run the test suite:

```bash
npm test -- goalOriented.test.ts
```

Tests cover:
- Goal progression
- Tactic selection
- User pushback handling
- Detour management
- State reset

## 🔄 Integration with Existing AI

This system integrates with your existing `NexusAIGatewayService` and follows Nexus patterns:

- Uses `BaseService` for consistent error handling
- Follows TypeScript strict mode
- Uses project logging (`@/shared/utils/logger`)
- Implements proper error boundaries
- Follows React 19 patterns

## 🎯 Key Benefits

1. **Consistent Personality** - AI maintains mission across conversations
2. **Goal-Driven** - Every response advances toward specific outcomes
3. **User-Flexible** - Allows detours while maintaining direction
4. **Transparent** - Users can see what the AI is trying to achieve
5. **Testable** - Clear state machine with predictable behavior
6. **Extensible** - Easy to add new goals and tactics

## 🚨 Safety Features

- **No Nagging** - Respects user pushback
- **Detour Budget** - Limits off-topic engagement
- **Graceful Degradation** - Falls back to reflection if no tactics available
- **Error Handling** - Comprehensive error boundaries and logging

This system transforms your AI from a reactive chatbot into a **goal-oriented business advisor** that helps users achieve specific outcomes while maintaining a consistent, helpful personality.
