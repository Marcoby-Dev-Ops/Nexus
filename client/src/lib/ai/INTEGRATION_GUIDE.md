# Goal-Oriented AI Integration Guide

This guide shows you how to integrate the goal-oriented AI system with your existing Nexus codebase.

## 🚀 Quick Start

### 1. Basic Integration (Drop-in Component)

```tsx
import { GoalOrientedChat } from '@/ai/components/GoalOrientedChat';

export default function MyPage() {
  return (
    <div className="p-6">
      <GoalOrientedChat 
        tenantId="your-tenant-id"
        userId="user-123"
        conversationId="conv-456"
      />
    </div>
  );
}
```

### 2. Using the Hook for Custom UI

```tsx
import { useGoalOrientedAI } from '@/ai/hooks/useGoalOrientedAI';

function MyCustomChat() {
  const { 
    messages, 
    progress, 
    loading, 
    sendMessage, 
    turn, 
    resetConversation 
  } = useGoalOrientedAI('tenant-id', 'user-id', 'conversation-id');

  const handleSend = async (message: string) => {
    await sendMessage(message);
  };

  const handleQuickTurn = async () => {
    const response = await turn("I want to improve my sales process", "");
    console.log('Response:', response);
  };

  return (
    <div>
      {/* Your custom UI */}
      <div className="flex gap-2">
        <button onClick={handleQuickTurn}>Quick Turn</button>
        <button onClick={resetConversation}>Reset</button>
      </div>
      
      {/* Progress tracking */}
      {progress && (
        <div>
          Progress: {progress.completedGoals}/{progress.totalGoals}
          Satisfaction: {Math.round(progress.satisfaction * 100)}%
        </div>
      )}
    </div>
  );
}
```

### 3. Direct Service Integration

```tsx
import { GoalOrientedAIService } from '@/ai/services/GoalOrientedAIService';

async function handleBusinessLogic() {
  const service = new GoalOrientedAIService();
  
  const result = await service.turn({
    conversationId: 'conv-123',
    userUtterance: "I need help with business strategy",
    context: "User is a small business owner looking to scale",
    tenantId: 'tenant-123',
    userId: 'user-456'
  });

  if (result.success && result.data) {
    console.log('AI Response:', result.data.message);
    console.log('Tactic Used:', result.data.tactic);
    console.log('Conversation State:', result.data.state);
  }
}
```

## 🔧 Integration with Existing Components

### With useAIChatStore

You can enhance your existing chat store with goal-oriented features:

```tsx
import { useAIChatStore } from '@/shared/stores/useAIChatStore';
import { useGoalOrientedAI } from '@/ai/hooks/useGoalOrientedAI';

function EnhancedChat() {
  const chatStore = useAIChatStore();
  const goalAI = useGoalOrientedAI('tenant-id', 'user-id', 'conversation-id');

  const handleSendMessage = async (message: string) => {
    // Use existing chat store for basic functionality
    await chatStore.sendMessage(message);
    
    // Enhance with goal-oriented features
    const goalResponse = await goalAI.turn(message, "");
    
    // You can now track both regular chat and goal progress
    console.log('Goal Progress:', goalAI.progress);
  };

  return (
    <div>
      {/* Your existing chat UI */}
      {/* Enhanced with goal progress */}
      {goalAI.progress && (
        <div className="goal-progress">
          <span>Goals: {goalAI.progress.completedGoals}/{goalAI.progress.totalGoals}</span>
        </div>
      )}
    </div>
  );
}
```

### With Existing AI Gateway

The system integrates seamlessly with your `NexusAIGatewayService`:

```tsx
// The GoalOrientedAIService automatically uses your existing gateway
const service = new GoalOrientedAIService();
// This internally uses NexusAIGatewayService for LLM calls
```

## 🎯 Customization Examples

### 1. Custom Goal Progress UI

```tsx
function GoalProgressBar({ progress }: { progress: any }) {
  const percentage = progress ? (progress.completedGoals / progress.totalGoals) * 100 : 0;
  
  return (
    <div className="goal-progress-bar">
      <div className="progress-track">
        <div 
          className="progress-fill" 
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="goal-labels">
        {progress?.currentGoals.map((goal: string) => (
          <span key={goal} className="goal-chip">
            {goal}
          </span>
        ))}
      </div>
    </div>
  );
}
```

### 2. Tactic-Aware UI

```tsx
function TacticIndicator({ tactic }: { tactic: string }) {
  const tacticLabels: Record<string, string> = {
    ask_intent: 'Understanding Intent',
    propose_plan: 'Proposing Plan',
    ask_commitment: 'Securing Commitment',
    handle_pushback: 'Addressing Concerns'
  };

  return (
    <div className="tactic-indicator">
      <span className="tactic-badge">
        {tacticLabels[tactic] || tactic}
      </span>
    </div>
  );
}
```

### 3. Context Integration

```tsx
async function handleContextualTurn(userMessage: string) {
  // Get relevant context from your existing systems
  const context = await getBusinessContext(userMessage);
  
  // Use goal-oriented AI with context
  const response = await goalAI.turn(userMessage, context);
  
  return response;
}
```

## 🔄 Advanced Integration Patterns

### 1. Multi-Modal Integration

```tsx
function MultiModalChat() {
  const goalAI = useGoalOrientedAI('tenant-id', 'user-id', 'conversation-id');
  const [mode, setMode] = useState<'goal' | 'regular'>('goal');

  const handleSend = async (message: string) => {
    if (mode === 'goal') {
      await goalAI.sendMessage(message);
    } else {
      // Use regular chat
      await regularChatStore.sendMessage(message);
    }
  };

  return (
    <div>
      <div className="mode-switcher">
        <button 
          onClick={() => setMode('goal')}
          className={mode === 'goal' ? 'active' : ''}
        >
          Goal-Oriented
        </button>
        <button 
          onClick={() => setMode('regular')}
          className={mode === 'regular' ? 'active' : ''}
        >
          Regular Chat
        </button>
      </div>
      
      {/* Chat UI */}
    </div>
  );
}
```

### 2. Workflow Integration

```tsx
function WorkflowChat() {
  const goalAI = useGoalOrientedAI('tenant-id', 'user-id', 'conversation-id');
  
  const handleWorkflowStep = async (step: string) => {
    // Integrate with your existing workflow system
    const workflowContext = await getWorkflowContext(step);
    
    // Use goal-oriented AI to guide the workflow
    const response = await goalAI.turn(
      `Help me with step: ${step}`, 
      workflowContext
    );
    
    // Update workflow state based on goal progress
    if (goalAI.progress?.completedGoals === goalAI.progress?.totalGoals) {
      await completeWorkflowStep(step);
    }
  };

  return (
    <div>
      {/* Workflow UI with goal progress */}
    </div>
  );
}
```

### 3. Analytics Integration

```tsx
function AnalyticsChat() {
  const goalAI = useGoalOrientedAI('tenant-id', 'user-id', 'conversation-id');
  
  // Track goal completion for analytics
  useEffect(() => {
    if (goalAI.progress) {
      trackGoalProgress({
        conversationId: 'conversation-id',
        completedGoals: goalAI.progress.completedGoals,
        totalGoals: goalAI.progress.totalGoals,
        satisfaction: goalAI.progress.satisfaction,
        tactic: goalAI.progress.tactic
      });
    }
  }, [goalAI.progress]);

  return (
    <div>
      {/* Chat UI with analytics tracking */}
    </div>
  );
}
```

## 🧪 Testing Integration

### 1. Unit Tests

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { GoalOrientedChat } from '@/ai/components/GoalOrientedChat';

test('goal-oriented chat progresses through goals', async () => {
  render(
    <GoalOrientedChat 
      tenantId="test-tenant"
      userId="test-user"
      conversationId="test-conversation"
    />
  );

  const input = screen.getByPlaceholderText(/type your message/i);
  const sendButton = screen.getByText(/send/i);

  // Send initial message
  fireEvent.change(input, { target: { value: 'I want to improve my business' } });
  fireEvent.click(sendButton);

  // Check that goal progress is shown
  await screen.findByText(/progress/i);
});
```

### 2. Integration Tests

```tsx
import { GoalOrientedAIService } from '@/ai/services/GoalOrientedAIService';

test('service integrates with existing gateway', async () => {
  const service = new GoalOrientedAIService();
  
  const result = await service.turn({
    conversationId: 'test-conv',
    userUtterance: 'Test message',
    context: 'Test context',
    tenantId: 'test-tenant',
    userId: 'test-user'
  });

  expect(result.success).toBe(true);
  expect(result.data).toHaveProperty('message');
  expect(result.data).toHaveProperty('tactic');
});
```

## 🚨 Best Practices

### 1. Error Handling

```tsx
function SafeGoalChat() {
  const goalAI = useGoalOrientedAI('tenant-id', 'user-id', 'conversation-id');

  const handleSend = async (message: string) => {
    try {
      await goalAI.sendMessage(message);
    } catch (error) {
      // Fallback to regular chat if goal-oriented fails
      console.error('Goal-oriented chat failed:', error);
      await regularChatStore.sendMessage(message);
    }
  };

  return (
    <div>
      {goalAI.error && (
        <div className="error-banner">
          Goal-oriented features temporarily unavailable
        </div>
      )}
      {/* Chat UI */}
    </div>
  );
}
```

### 2. Performance Optimization

```tsx
function OptimizedGoalChat() {
  const goalAI = useGoalOrientedAI('tenant-id', 'user-id', 'conversation-id');
  
  // Debounce rapid messages
  const debouncedSend = useMemo(
    () => debounce(goalAI.sendMessage, 300),
    [goalAI.sendMessage]
  );

  // Memoize progress calculations
  const progressDisplay = useMemo(() => {
    if (!goalAI.progress) return null;
    
    return (
      <div className="progress-display">
        {goalAI.progress.completedGoals}/{goalAI.progress.totalGoals} goals complete
      </div>
    );
  }, [goalAI.progress]);

  return (
    <div>
      {progressDisplay}
      {/* Chat UI */}
    </div>
  );
}
```

### 3. Accessibility

```tsx
function AccessibleGoalChat() {
  const goalAI = useGoalOrientedAI('tenant-id', 'user-id', 'conversation-id');

  return (
    <div role="main" aria-label="Goal-oriented chat">
      {/* Progress indicators with ARIA labels */}
      <div 
        role="progressbar" 
        aria-valuenow={goalAI.progress?.completedGoals || 0}
        aria-valuemax={goalAI.progress?.totalGoals || 0}
        aria-label="Goal completion progress"
      >
        Progress: {goalAI.progress?.completedGoals || 0}/{goalAI.progress?.totalGoals || 0}
      </div>
      
      {/* Chat messages with proper roles */}
      <div role="log" aria-label="Chat messages">
        {goalAI.messages.map((message) => (
          <div 
            key={message.id}
            role="article"
            aria-label={`${message.role} message`}
          >
            {message.content}
          </div>
        ))}
      </div>
    </div>
  );
}
```

## 📊 Monitoring & Analytics

### 1. Goal Completion Tracking

```tsx
function trackGoalCompletion(conversationId: string, goalId: string) {
  analytics.track('goal_completed', {
    conversationId,
    goalId,
    timestamp: new Date().toISOString(),
    sessionId: getSessionId()
  });
}
```

### 2. Tactic Performance

```tsx
function trackTacticUsage(tactic: string, success: boolean) {
  analytics.track('tactic_used', {
    tactic,
    success,
    timestamp: new Date().toISOString()
  });
}
```

### 3. User Satisfaction

```tsx
function trackSatisfaction(conversationId: string, satisfaction: number) {
  analytics.track('satisfaction_updated', {
    conversationId,
    satisfaction,
    timestamp: new Date().toISOString()
  });
}
```

This integration guide provides comprehensive examples of how to use the goal-oriented AI system with your existing Nexus codebase. The system is designed to be flexible and can be integrated at various levels depending on your needs.
