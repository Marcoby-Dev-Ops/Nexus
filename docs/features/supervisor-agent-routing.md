# Supervisor Agent Routing

## Overview
The Supervisor Agent Routing system intelligently analyzes user queries and automatically routes them to the most appropriate specialist agent based on intent, keywords, and context.

## Features

### 🎯 **Intelligent Intent Analysis**
- **Keyword-based routing**: Analyzes user queries for department-specific keywords
- **Strategic query detection**: Identifies high-level strategic queries for Executive Assistant
- **Confidence scoring**: Provides confidence levels for routing decisions
- **Fallback logic**: Defaults to Executive Assistant for ambiguous queries

### 🤖 **Agent Specialization**
- **Executive Assistant**: Strategic planning, cross-department coordination, executive reporting
- **Sales Director**: Sales strategy, pipeline management, revenue optimization
- **Finance Director**: Financial planning, budget management, cost optimization
- **Operations Director**: Process optimization, automation, operational efficiency
- **Marketing Director**: Marketing strategy, growth hacking, brand management

### 📊 **Visual Feedback**
- **Routing indicators**: Shows which agent handled the query
- **Confidence display**: Displays routing confidence percentage
- **Auto-route option**: "Auto-Route (Supervisor)" option in agent picker

## Completion Criteria

### ✅ **Functional Requirements**
- [ ] Intent analysis correctly identifies department-specific queries
- [ ] Strategic queries are routed to Executive Assistant
- [ ] Confidence scoring works within expected ranges (0.3-0.9)
- [ ] Fallback to Executive Assistant for ambiguous queries
- [ ] Visual routing indicators display correctly
- [ ] Agent-specific system prompts are applied correctly

### ✅ **Technical Requirements**
- [ ] Backend edge function processes routing metadata
- [ ] Frontend displays routing information in chat
- [ ] Agent picker includes "Auto-Route" option
- [ ] Streaming responses include routing metadata
- [ ] Error handling for malformed routing data

### ✅ **User Experience Requirements**
- [ ] Routing happens transparently without user confusion
- [ ] Routing confidence is displayed clearly
- [ ] Users can override auto-routing by selecting specific agents
- [ ] Routing indicators are visually distinct but not intrusive

## Testing Strategy

### 🧪 **Unit Tests**
```typescript
// Test intent analysis function
describe('analyzeIntent', () => {
  it('should route sales queries to sales agent', () => {
    const result = analyzeIntent('How can I improve my sales pipeline?');
    expect(result.agent).toBe('sales');
    expect(result.confidence).toBeGreaterThan(0.5);
  });

  it('should route strategic queries to executive', () => {
    const result = analyzeIntent('What should our business strategy be?');
    expect(result.agent).toBe('executive');
    expect(result.confidence).toBeGreaterThan(0.8);
  });

  it('should handle ambiguous queries', () => {
    const result = analyzeIntent('Hello');
    expect(result.agent).toBe('executive');
    expect(result.confidence).toBeLessThan(0.7);
  });
});
```

### 🔍 **Integration Tests**
```typescript
// Test end-to-end routing flow
describe('Supervisor Agent Routing', () => {
  it('should route query and return appropriate response', async () => {
    const response = await fetch('/functions/v1/ai-rag-assessment-chat', {
      method: 'POST',
      body: JSON.stringify({
        query: 'How can I reduce operational costs?',
        agentId: 'auto'
      })
    });

    const stream = response.body;
    // Verify routing metadata in stream
    // Verify agent-specific response
  });
});
```

### 📋 **Manual Test Cases**

#### **Test Case 1: Sales Query Routing**
- **Input**: "How can I improve my conversion rates?"
- **Expected**: Routes to Sales Director with high confidence
- **Verification**: Check routing indicator shows "Sales Director"

#### **Test Case 2: Strategic Query Routing**
- **Input**: "What should our company priorities be for next quarter?"
- **Expected**: Routes to Executive Assistant with high confidence
- **Verification**: Check routing indicator shows "Executive Assistant"

#### **Test Case 3: Ambiguous Query Handling**
- **Input**: "Can you help me?"
- **Expected**: Routes to Executive Assistant with lower confidence
- **Verification**: Check confidence score is displayed as < 70%

#### **Test Case 4: Multi-keyword Query**
- **Input**: "How can I optimize our marketing budget and reduce costs?"
- **Expected**: Routes to highest-scoring agent (likely Finance or Marketing)
- **Verification**: Check reasoning explains keyword matching

#### **Test Case 5: Manual Override**
- **Input**: Select specific agent instead of "Auto-Route"
- **Expected**: No routing metadata, uses selected agent
- **Verification**: No routing indicator displayed

## Usage Examples

### **Frontend Integration**
```tsx
// AgentPicker with auto-route option
<AgentPicker 
  value={selectedAgent} 
  onChange={setSelectedAgent}
  // "auto" value triggers supervisor routing
/>

// Chat message with routing info
{message.routing && (
  <div className="routing-indicator">
    🤖 Auto-routed to {message.routing.agent}
    ({Math.round(message.routing.confidence * 100)}% confidence)
  </div>
)}
```

### **Backend Processing**
```typescript
// Supervisor routing logic
if (!selectedAgent || selectedAgent === 'auto') {
  const routing = analyzeIntent(query);
  selectedAgent = routing.agent;
  routingInfo = routing;
}

// Agent-specific system prompt
const agent = AGENT_REGISTRY[selectedAgent];
const systemPrompt = `${agent.systemPrompt}

SPECIALTIES: ${agent.specialties.join(', ')}`;
```

## Performance Metrics

### **Routing Accuracy**
- **Target**: >85% user satisfaction with routing decisions
- **Measurement**: User feedback on routing appropriateness
- **Monitoring**: Track routing confidence vs. user overrides

### **Response Quality**
- **Target**: Agent-specific responses show domain expertise
- **Measurement**: Response relevance to query domain
- **Monitoring**: Compare responses across different agents

### **System Performance**
- **Target**: <200ms additional latency for routing analysis
- **Measurement**: Time from query to first response chunk
- **Monitoring**: Edge function execution time

## Troubleshooting

### **Common Issues**
1. **Incorrect Routing**: Check keyword lists and confidence thresholds
2. **Missing Routing Info**: Verify agentId parameter handling
3. **Display Issues**: Check frontend routing indicator logic
4. **Performance**: Monitor intent analysis execution time

### **Debug Information**
```typescript
// Enable routing debug logs
console.log('Supervisor routing:', {
  query,
  selectedAgent,
  confidence,
  reasoning
});
```

## Future Enhancements

### **Planned Improvements**
- [ ] Machine learning-based intent classification
- [ ] User preference learning and adaptation
- [ ] Multi-agent collaboration for complex queries
- [ ] Advanced context awareness (conversation history)
- [ ] Custom routing rules per organization

### **Analytics Integration**
- [ ] Track routing accuracy metrics
- [ ] Monitor agent performance by domain
- [ ] Identify routing improvement opportunities
- [ ] User satisfaction feedback collection

## Deployment Checklist

### **Pre-deployment**
- [ ] All unit tests passing
- [ ] Integration tests completed
- [ ] Manual test cases verified
- [ ] Performance benchmarks met
- [ ] Documentation updated

### **Post-deployment**
- [ ] Monitor routing accuracy
- [ ] Check error rates
- [ ] Verify user experience
- [ ] Collect initial feedback
- [ ] Update metrics dashboard

## Support

### **Monitoring**
- **Logs**: Check Supabase Edge Function logs for routing decisions
- **Metrics**: Monitor routing confidence distribution
- **Errors**: Track routing failures and fallback usage

### **User Feedback**
- **Collection**: In-app feedback on routing accuracy
- **Analysis**: Regular review of routing decisions
- **Improvement**: Iterative refinement of routing logic 