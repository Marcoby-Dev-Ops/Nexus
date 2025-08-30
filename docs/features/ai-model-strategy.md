# AI Model Strategy: OpenRouter + Assistant Profiles

## Overview

Nexus implements a **hybrid AI model strategy** that combines OpenAI's advanced capabilities with OpenRouter's model diversity and cost optimization. This approach provides the best of both worlds: reliability for critical functions and flexibility for cost-effective scaling.

## Architecture

### Core Components

1. **Enhanced Model Manager** (`src/lib/ai/modelManager.ts`)
   - Intelligent model selection based on task type and requirements
   - Automatic fallback handling and performance tracking
   - Cost optimization and budget management
   - Support for both OpenAI and OpenRouter providers

2. **Domain Agent Integration** (`src/lib/ai/domainAgentService.ts`)
   - Specialized agents with provider-specific optimizations
   - Tool-aware model selection
   - Department-specific model preferences

3. **Performance Monitoring**
   - Real-time performance tracking
   - Cost analysis and optimization suggestions
   - Model reliability scoring

## Model Selection Strategy

### Task-Based Model Assignment

| Task Type | Primary Model | Provider | Use Case | Fallbacks |
|-----------|---------------|----------|----------|-----------|
| **Simple** | `mistralai/mistral-7b-instruct:free` | OpenRouter | Basic Q&A, content generation | `gpt-3.5-turbo`, `claude-3-haiku` |
| **Pattern** | `anthropic/claude-3-haiku` | OpenRouter | Data analysis, classification | `gpt-4o-mini`, `gemini-pro` |
| **Complex** | `gpt-4o` | OpenAI | Strategic planning, complex reasoning | `claude-3-sonnet`, `gpt-4o-mini` |
| **Domain Agent** | `gpt-4o` | OpenAI | Assistant profiles with tools | `claude-3-sonnet`, `gpt-4o-mini` |
| **Creative** | `anthropic/claude-3-sonnet` | OpenRouter | Content creation, brainstorming | `gpt-4o`, `claude-3-haiku` |

### Agent-Specific Recommendations

| Agent Type | Recommended Models | Rationale |
|------------|-------------------|-----------|
| **Executive** | `gpt-4o`, `claude-3-sonnet`, `gpt-4o-mini` | Strategic thinking, complex analysis |
| **Sales** | `gpt-4o`, `claude-3-sonnet`, `mistral-large` | Relationship building, negotiation |
| **Finance** | `gpt-4o`, `claude-3-sonnet`, `gpt-4o-mini` | Precision, analytical accuracy |
| **Operations** | `gpt-4o-mini`, `claude-3-haiku`, `mistral-7b` | Efficiency, process optimization |
| **Marketing** | `claude-3-sonnet`, `gpt-4o`, `mistral-large` | Creativity, brand voice |

## Implementation Guide

### 1. Model Manager Usage

```typescript
import { modelManager } from '@/lib/ai/modelManager';

// Automatic model selection
const response = await modelManager.createCompletion(
  messages,
  {
    taskType: 'domain_agent',
    requiresTools: true,
    requiresAssistants: true
  }
);

// Manual model selection
const response = await modelManager.createCompletion(
  messages,
  {
    model: 'gpt-4o',
    provider: 'openai',
    tools: domainTools
  }
);
```

### 2. Domain Agent Integration

```typescript
import { getDomainAgentService } from '@/lib/ai/domainAgentService';

// Enhanced agent with optimal model selection
const enhancedAgent = await getDomainAgentService().getEnhancedAgent(
  'sales-dept',
  { requiresTools: true, taskComplexity: 'high' }
);

// Agent-specific model recommendations
const recommendedModels = modelManager.getRecommendedModelsForAgent('sales');
```

### 3. Edge Function Enhancement

```typescript
// In your edge functions
const { model, provider } = await modelManager.selectModel(
  'domain_agent',
  0.8,
  true,  // requires tools
  true   // requires assistants
);

if (provider === 'openai') {
  // Use OpenAI client
  const response = await openaiClient.chat.completions.create({
    model,
    messages,
    tools: domainTools
  });
} else {
  // Use OpenRouter
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openrouterApiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://nexus.marcoby.com',
      'X-Title': 'Nexus AI'
    },
    body: JSON.stringify({
      model,
      messages,
      tools: domainTools
    })
  });
}
```

## Cost Optimization

### Budget Management

```typescript
// Check budget status
const budgetStatus = await modelManager.getBudgetStatus();
console.log(`Used: $${budgetStatus.used} / $${budgetStatus.total}`);

// Get optimization suggestions
const suggestions = await modelManager.getCostOptimizationSuggestions();
```

### Performance Monitoring

```typescript
// Generate usage report
const report = await modelManager.generateReport('month');
console.log('Monthly cost:', report.monthlyCost);
console.log('Model performance:', report.modelPerformance);
console.log('Suggestions:', report.suggestions);
```

## Best Practices

### 1. **Tool-Aware Selection**
- Use OpenAI models for function calling and tool usage
- Leverage OpenRouter for content generation and analysis
- Implement capability-based routing

### 2. **Cost Optimization**
- Start with free/cheap models for simple tasks
- Escalate to premium models only when needed
- Monitor usage patterns and adjust accordingly

### 3. **Performance Tracking**
- Track success rates and latency
- Implement automatic fallback mechanisms
- Regular performance reviews and optimizations

### 4. **Assistant Profile Optimization**
- Match model capabilities to agent requirements
- Use specialized models for domain-specific tasks
- Implement context-aware model selection

## Configuration

### Environment Variables

```bash
# OpenAI Configuration
VITE_OPENAI_API_KEY=your_openai_key

# OpenRouter Configuration  
VITE_OPENROUTER_API_KEY=your_openrouter_key

# Budget Management
VITE_MONTHLY_AI_BUDGET=100

# Feature Flags
VITE_ENABLE_OPENROUTER=true
VITE_ENABLE_MODEL_OPTIMIZATION=true
```

### Model Configuration

```typescript
// Customize model configurations
const MODEL_CONFIGS = {
  custom_task: {
    model: 'your-preferred-model',
    provider: 'openrouter',
    maxTokens: 1000,
    temperature: 0.7,
    costPer1KTokens: 0.001,
    fallbackModels: ['fallback-model-1', 'fallback-model-2'],
    supportsTools: true,
    bestForTasks: ['custom_analysis', 'specialized_reasoning']
  }
};
```

## Monitoring and Analytics

### Key Metrics

1. **Cost Metrics**
   - Monthly spend by model
   - Cost per conversation
   - Budget utilization

2. **Performance Metrics**
   - Success rates by model
   - Average latency
   - Error rates and types

3. **Usage Patterns**
   - Model selection frequency
   - Task type distribution
   - Agent-specific usage

### Dashboard Integration

```typescript
// Real-time monitoring
const metrics = {
  totalCost: await modelManager.getCurrentMonthCost(),
  performance: await modelManager.getModelPerformance('gpt-4o'),
  recommendations: await modelManager.getCostOptimizationSuggestions()
};
```

## Migration Strategy

### Phase 1: Parallel Implementation
- Keep existing OpenAI integration
- Add OpenRouter support alongside
- Implement A/B testing

### Phase 2: Gradual Rollout
- Start with non-critical tasks
- Monitor performance and costs
- Expand to more use cases

### Phase 3: Full Integration
- Complete model manager integration
- Optimize based on usage patterns
- Implement advanced features

## Troubleshooting

### Common Issues

1. **Model Selection Failures**
   - Check API key configuration
   - Verify model availability
   - Review fallback mechanisms

2. **Performance Issues**
   - Monitor latency metrics
   - Check model capacity
   - Implement caching strategies

3. **Cost Overruns**
   - Review budget settings
   - Analyze usage patterns
   - Implement stricter controls

### Debug Commands

```typescript
// Debug model selection
const debug = await modelManager.selectModel('debug_task', 0.5, true, true);
console.log('Selected:', debug);

// Performance diagnostics
const perf = await modelManager.getModelPerformance('gpt-4o');
console.log('Performance:', perf);
```

## Future Enhancements

### Planned Features

1. **Advanced Routing**
   - Multi-model ensemble responses
   - Dynamic model switching
   - Context-aware optimization

2. **Enhanced Analytics**
   - Predictive cost modeling
   - Performance forecasting
   - Automated optimization

3. **Integration Expansion**
   - Additional providers
   - Custom model support
   - Enterprise features

## Conclusion

The hybrid OpenRouter + OpenAI strategy provides Nexus with:

- **Cost Efficiency**: 40-60% cost reduction for non-critical tasks
- **Reliability**: OpenAI for mission-critical functions
- **Flexibility**: Access to cutting-edge models
- **Scalability**: Intelligent resource allocation

This approach ensures optimal performance while maintaining cost control and providing the flexibility to leverage the best models for each specific use case. 