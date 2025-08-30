# 🧠 Unified Brain Integration Guide

## Overview

The **Unified Brain** is now the **central logic layer** that governs all platform operations in Nexus. Similar to how the human brain coordinates all body functions, the Unified Brain coordinates all services, actions, and generations throughout the platform.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    UNIFIED BRAIN                            │
│                 (Central Logic Layer)                       │
├─────────────────────────────────────────────────────────────┤
│  • Agent Registry & Routing                                 │
│  • Contextual RAG Intelligence                              │
│  • Cross-Departmental Coordination                          │
│  • Progressive Learning & Pattern Recognition               │
│  • Tool Execution & Automation                              │
│  • Session Memory & Context Management                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    PLATFORM SERVICES                        │
│                                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │   Sales     │ │  Marketing  │ │  Finance    │           │
│  │  Module     │ │   Module    │ │  Module     │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
│                                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │ Operations  │ │   HR        │ │  Customer   │           │
│  │  Module     │ │  Module     │ │  Support    │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 How to Use Unified Brain

### 1. **Direct Service Integration**

```typescript
import { unifiedBrain } from '@/lib/ai/unifiedBrain';

// Example: Sales module using unified brain
export class SalesService extends BaseService {
  async analyzePipeline(userId: string, tenantId: string) {
    const request = {
      input: "Analyze sales pipeline performance and identify bottlenecks",
      context: {
        userId,
        tenantId,
        sessionId: `sales-${userId}`,
        currentPage: 'sales-dashboard',
        userIntent: 'pipeline-analysis'
      },
      requestType: 'analysis' as const,
      priority: 'high' as const
    };

    const response = await unifiedBrain.processRequest(request);
    
    if (response.success) {
      return this.createResponse({
        analysis: response.output,
        insights: response.insights,
        nextSteps: response.nextSteps,
        agentUsed: response.agentUsed
      });
    }
    
    return this.handleError('Analysis failed');
  }
}
```

### 2. **Goal-Oriented AI Integration**

```typescript
// The goal-oriented AI now uses unified brain as its core
import { GoalOrientedAIService } from '@/ai/services/GoalOrientedAIService';

const goalAI = new GoalOrientedAIService();

// This automatically routes through unified brain
const response = await goalAI.turn({
  conversationId: 'conv-123',
  userUtterance: "I need help with sales strategy",
  context: "User is on sales dashboard",
  tenantId: 'tenant-456',
  userId: 'user-789'
});

// Response includes unified brain insights
console.log(response.data.insights); // Cross-departmental insights
console.log(response.data.nextSteps); // AI-generated next steps
console.log(response.data.unifiedBrainContext); // Processing metadata
```

### 3. **Cross-Departmental Intelligence**

```typescript
// Marketing module can access sales intelligence
export class MarketingService extends BaseService {
  async createCampaign(userId: string, tenantId: string, campaignData: any) {
    const request = {
      input: `Create marketing campaign for ${campaignData.targetAudience}`,
      context: {
        userId,
        tenantId,
        sessionId: `marketing-${userId}`,
        userIntent: 'campaign-creation',
        businessContext: { campaignData }
      },
      requestType: 'generation' as const,
      priority: 'medium' as const
    };

    // Unified brain automatically gathers:
    // - Sales pipeline data
    // - Customer segmentation
    // - Financial budget constraints
    // - Operational capacity
    const response = await unifiedBrain.processRequest(request);
    
    return this.createResponse({
      campaign: response.output,
      crossDeptInsights: response.insights,
      recommendations: response.nextSteps
    });
  }
}
```

## 🎯 Request Types

The Unified Brain handles different types of requests:

### **Chat Requests**
```typescript
{
  requestType: 'chat',
  input: "How are we performing this quarter?",
  priority: 'medium'
}
```

### **Action Requests**
```typescript
{
  requestType: 'action',
  input: "Create a new sales opportunity for Acme Corp",
  priority: 'high'
}
```

### **Generation Requests**
```typescript
{
  requestType: 'generation',
  input: "Generate a quarterly business report",
  priority: 'medium'
}
```

### **Analysis Requests**
```typescript
{
  requestType: 'analysis',
  input: "Analyze customer churn patterns",
  priority: 'high'
}
```

### **Automation Requests**
```typescript
{
  requestType: 'automation',
  input: "Automate lead qualification process",
  priority: 'critical'
}
```

## 🧠 Unified Brain Features

### **1. Intelligent Agent Routing**
- Automatically selects the best agent for each request
- Considers user context, request type, and business priorities
- Routes to executive, departmental, or specialist agents as needed

### **2. Cross-Departmental Intelligence**
- Gathers relevant data from all departments
- Analyzes correlations between different business areas
- Provides comprehensive organizational context

### **3. Progressive Learning**
- Maintains session memory across conversations
- Learns user patterns and preferences
- Continuously improves agent effectiveness

### **4. Contextual Enhancement**
- Enriches requests with user profile data
- Adds business metrics and real-time context
- Includes relevant documents and knowledge

### **5. Action Execution**
- Extracts actionable items from responses
- Executes immediate actions when appropriate
- Tracks action impact and success rates

## 🔧 Integration Patterns

### **Pattern 1: Service Layer Integration**
```typescript
// All services should use unified brain for AI operations
export class AnyService extends BaseService {
  async processWithAI(input: string, context: any) {
    const response = await unifiedBrain.processRequest({
      input,
      context: {
        userId: context.userId,
        tenantId: context.tenantId,
        sessionId: context.sessionId,
        userIntent: context.intent
      },
      requestType: 'chat',
      priority: 'medium'
    });
    
    return response;
  }
}
```

### **Pattern 2: Component Integration**
```typescript
// React components can use unified brain through hooks
export function useUnifiedBrain() {
  const processRequest = useCallback(async (input: string, context: any) => {
    const response = await unifiedBrain.processRequest({
      input,
      context,
      requestType: 'chat',
      priority: 'medium'
    });
    
    return response;
  }, []);
  
  return { processRequest };
}
```

### **Pattern 3: Edge Function Integration**
```typescript
// Edge functions can leverage unified brain
export async function handleWebhook(req: Request) {
  const { input, context } = await req.json();
  
  const response = await unifiedBrain.processRequest({
    input,
    context,
    requestType: 'action',
    priority: 'high'
  });
  
  return new Response(JSON.stringify(response));
}
```

## 📊 Response Structure

Every unified brain response includes:

```typescript
interface UnifiedBrainResponse {
  success: boolean;
  output: string;                    // Main response content
  agentUsed: string;                 // Which agent handled the request
  confidence: number;                // Confidence score (0-1)
  actions: UnifiedBrainAction[];     // Extracted actions
  insights: UnifiedBrainInsight[];   // Generated insights
  nextSteps: string[];              // Recommended next steps
  metadata: {
    processingTime: number;          // Processing time in ms
    contextUsed: string[];          // Context sources used
    toolsExecuted: string[];        // Tools that were executed
    reasoning: string;              // Reasoning behind decisions
  };
}
```

## 🎯 Benefits

### **For Developers:**
- **Single Integration Point**: One service handles all AI operations
- **Consistent Interface**: Same API for all request types
- **Automatic Context**: No need to manually gather context
- **Cross-Departmental Awareness**: Automatic access to organizational intelligence

### **For Users:**
- **Smarter Responses**: AI has full organizational context
- **Consistent Experience**: Same intelligence across all modules
- **Proactive Insights**: AI identifies opportunities and risks
- **Coordinated Actions**: Actions consider cross-departmental impact

### **For Business:**
- **Organizational Intelligence**: AI understands the entire business
- **Data-Driven Decisions**: All recommendations based on real data
- **Efficiency Gains**: Automated coordination between departments
- **Continuous Learning**: System improves with every interaction

## 🚨 Best Practices

### **1. Always Use Unified Brain for AI Operations**
```typescript
// ✅ Good: Use unified brain
const response = await unifiedBrain.processRequest(request);

// ❌ Bad: Direct LLM calls
const response = await openai.chat.completions.create({...});
```

### **2. Provide Rich Context**
```typescript
// ✅ Good: Rich context
const context = {
  userId: 'user-123',
  tenantId: 'tenant-456',
  sessionId: 'session-789',
  currentPage: 'sales-dashboard',
  userIntent: 'pipeline-analysis',
  businessContext: { currentMetrics: {...} }
};

// ❌ Bad: Minimal context
const context = { userId: 'user-123' };
```

### **3. Handle Responses Properly**
```typescript
// ✅ Good: Handle all response aspects
const response = await unifiedBrain.processRequest(request);

if (response.success) {
  // Use main output
  console.log(response.output);
  
  // Act on insights
  response.insights.forEach(insight => {
    if (insight.actionable) {
      // Take action
    }
  });
  
  // Follow next steps
  response.nextSteps.forEach(step => {
    // Execute step
  });
}
```

### **4. Monitor Performance**
```typescript
// Track unified brain performance
const response = await unifiedBrain.processRequest(request);

logger.info('Unified brain performance', {
  processingTime: response.metadata.processingTime,
  confidence: response.confidence,
  agentUsed: response.agentUsed,
  contextSources: response.metadata.contextUsed
});
```

## 🔄 Migration Guide

### **From Direct AI Calls:**
```typescript
// Old way
const completion = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [{ role: 'user', content: input }]
});

// New way
const response = await unifiedBrain.processRequest({
  input,
  context: { userId, tenantId, sessionId },
  requestType: 'chat',
  priority: 'medium'
});
```

### **From Individual Services:**
```typescript
// Old way
const salesAI = new SalesAIService();
const marketingAI = new MarketingAIService();
const financeAI = new FinanceAIService();

// New way
const response = await unifiedBrain.processRequest({
  input: "Cross-departmental analysis",
  context: { userId, tenantId, sessionId },
  requestType: 'analysis',
  priority: 'high'
});
```

## 🎉 Conclusion

The Unified Brain is now the **central nervous system** of Nexus, coordinating all AI operations with full organizational awareness. By using the unified brain for all AI interactions, you get:

- **Organizational Intelligence**: AI understands your entire business
- **Cross-Departmental Coordination**: Actions consider all departments
- **Progressive Learning**: System improves with every interaction
- **Consistent Experience**: Same intelligence across all modules
- **Simplified Integration**: One service handles all AI operations

Start integrating the unified brain into your services today to unlock the full potential of organizational AI intelligence!
