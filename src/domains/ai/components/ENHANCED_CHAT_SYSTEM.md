# Enhanced AI Chat System with Context Awareness

## Overview

The enhanced AI chat system provides comprehensive session data collection and context-aware responses for improved user experiences and business intelligence.

## Architecture

The system consists of multiple layers working together to provide intelligent, context-aware AI interactions:

1. **UI Layer**: OrganizationalChatPanel, ExecutiveAssistant, DepartmentalAgent
2. **Context Layer**: ChatContextBuilder for comprehensive context collection
3. **Service Layer**: enhancedChatService for AI interactions
4. **Data Layer**: Enhanced Supabase schema with session tracking
5. **AI Layer**: Enhanced Edge Function with context-aware prompts

## Core Components

### 1. ChatContextBuilder

**Location**: `client/src/lib/chatContext.ts`

**Purpose**: Collects comprehensive context for AI responses

**Key Features**:
- Session ID generation and tracking
- User behavior analysis
- Conversation pattern detection
- Context enrichment for AI prompts
- Performance monitoring

**Context Data Collected**:
```typescript
interface ChatContextMetadata {
  // Agent Context
  agent_id: string;
  agent_type: 'executive' | 'departmental' | 'specialist';
  department?: string;
  agent_switches?: Array<{
    from_agent: string;
    to_agent: string;
    timestamp: string;
    reason?: string;
  }>;

  // User Context
  user_location?: {
    page: string;
    section?: string;
    referrer?: string;
  };
  
  // Session Context
  session_id: string;
  device_info?: {
    user_agent: string;
    screen_resolution?: string;
    timezone?: string;
  };

  // Conversation Context
  conversation_stage: 'initial' | 'ongoing' | 'handoff' | 'resolution';
  conversation_intent?: string;
  conversation_sentiment?: 'positive' | 'neutral' | 'negative';
  
  // Analytics
  interaction_type: 'question' | 'command' | 'clarification' | 'feedback';
  topic_tags?: string[];
  escalation_level?: 'low' | 'medium' | 'high';
}
```

### 2. Enhanced Chat Service

**Location**: `client/src/lib/chatContext.ts`

**Purpose**: Manages AI interactions with comprehensive context

**Key Methods**:
- `sendMessageWithContext()`: Sends messages with full context data
- `callAIWithContext()`: Calls Edge Function with enhanced prompts
- `updateSessionAnalytics()`: Tracks session-level metrics
- `getSessionInsights()`: Provides analytics and insights

### 3. Database Schema

**Enhanced Tables**:
- `chat_sessions`: Session-level tracking and analytics
- `chat_messages`: Enhanced with comprehensive metadata
- `conversations`: Updated with session references
- `user_chat_analytics`: View for insights and reporting

### 4. Edge Function Enhancement

**Location**: `supabase/functions/chat/index.ts`

**Enhancements**:
- Accepts enhanced context data
- Builds comprehensive prompts
- Adjusts AI parameters based on context
- Tracks performance metrics
- Updates session analytics

## Usage Examples

### 1. Initialize Session

```typescript
import { ChatContextBuilder } from '@/lib/chatContext';
import { useAuth } from '@/lib/auth';

const { user } = useAuth();
const sessionId = ChatContextBuilder.generateSessionId(user.id);
```

### 2. Send Enhanced Message

```typescript
import { enhancedChatService } from '@/lib/chatContext';
import { executiveAgent } from '@/lib/agentRegistry';

const result = await enhancedChatService.sendMessageWithContext(
  conversationId,
  message,
  executiveAgent,
  sessionId
);

console.log('Context used:', result.context);
```

### 3. Get Session Analytics

```typescript
const insights = await enhancedChatService.getSessionInsights(userId, 7);
console.log('User insights:', insights);
```

## Key Features

### 1. Context Awareness
- **Page Context**: Knows what page user is on
- **Session History**: Tracks multi-conversation patterns
- **Agent Switching**: Records and analyzes agent transitions
- **Topic Detection**: Automatically tags conversation topics
- **Urgency Detection**: Identifies urgent requests for escalation

### 2. Intelligent Routing
- **Department Specialization**: Routes based on topic and context
- **Escalation Management**: Automatic detection of complex issues
- **Agent Suggestions**: AI suggests better-suited agents
- **Continuity**: Maintains context across agent switches

### 3. Performance Monitoring
- **Response Times**: Tracks AI response performance
- **Model Usage**: Monitors OpenAI API usage and costs
- **Confidence Scoring**: Rates response quality
- **Session Metrics**: Comprehensive session analytics

### 4. Business Intelligence
- **User Behavior**: Tracks interaction patterns
- **Department Usage**: Analytics per department
- **Satisfaction Tracking**: Collects user feedback
- **Trend Analysis**: Identifies usage patterns over time

## Configuration

### Environment Variables

```bash
# Required for Edge Function
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_key
OPENAI_API_KEY=your_openai_key

# Optional for enhanced features
ANALYTICS_ENABLED=true
DEBUG_CONTEXT=false
```

### Feature Flags

```typescript
// In your app configuration
const chatConfig = {
  enableContextAwareness: true,
  enableSessionTracking: true,
  enableAnalytics: true,
  enableEscalationDetection: true,
  maxContextMessages: 20,
  sessionTimeoutHours: 24,
};
```

## Deployment

### 1. Apply Database Migration

```bash
supabase db push
```

### 2. Deploy Enhanced Edge Function

```bash
supabase functions deploy chat
```

### 3. Update Frontend Code

The enhanced system is automatically enabled once the components are integrated.

## Analytics Dashboard

### Available Metrics

1. **Session Metrics**
   - Total sessions per user/day/department
   - Average session length
   - Messages per session
   - Agent usage patterns

2. **Performance Metrics**
   - AI response times
   - Model usage and costs
   - Error rates
   - User satisfaction scores

3. **Business Metrics**
   - Department engagement
   - Topic trend analysis
   - Escalation rates
   - Resolution success rates

### Sample Queries

```sql
-- Get user chat analytics for last 30 days
SELECT * FROM user_chat_analytics 
WHERE date >= NOW() - INTERVAL '30 days'
ORDER BY date DESC;

-- Get most active departments
SELECT 
  metadata->>'department' as department,
  COUNT(*) as message_count,
  COUNT(DISTINCT user_id) as unique_users
FROM chat_messages 
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY metadata->>'department'
ORDER BY message_count DESC;

-- Escalation analysis
SELECT 
  metadata->>'escalation_level' as level,
  COUNT(*) as count,
  AVG(EXTRACT(EPOCH FROM (
    SELECT MIN(created_at) 
    FROM chat_messages cm2 
    WHERE cm2.conversation_id = cm1.conversation_id 
    AND cm2.role = 'assistant'
    AND cm2.created_at > cm1.created_at
  ) - cm1.created_at)) as avg_response_time_seconds
FROM chat_messages cm1
WHERE cm1.role = 'user' 
AND cm1.created_at >= NOW() - INTERVAL '7 days'
GROUP BY metadata->>'escalation_level';
```

## Security Considerations

1. **Data Privacy**: All personal data encrypted and anonymized where possible
2. **Access Control**: RLS policies ensure users only see their own data
3. **API Security**: Edge Function validates JWT tokens
4. **Audit Trail**: Comprehensive logging for compliance

## Troubleshooting

### Common Issues

1. **Session Not Initializing**
   - Check user authentication
   - Verify ChatContextBuilder import
   - Ensure user.id is available

2. **Context Not Being Sent**
   - Verify sessionId is passed to components
   - Check enhancedChatService import
   - Review Edge Function logs

3. **Analytics Not Updating**
   - Confirm sessions table exists
   - Check database permissions
   - Verify RLS policies

### Debug Mode

```typescript
// Enable debug logging
localStorage.setItem('debug_chat_context', 'true');

// View session data
console.log('Session ID:', sessionId);
console.log('Context:', contextData);
```

## Performance Optimization

1. **Message Limiting**: Context limited to last 20 messages
2. **Caching**: Session data cached for performance
3. **Async Processing**: Analytics updated asynchronously
4. **Index Optimization**: Database indexes for fast queries

## Future Enhancements

1. **ML-Based Routing**: Train models on successful agent routing
2. **Sentiment Analysis**: Real-time sentiment detection
3. **Predictive Analytics**: Predict user needs based on patterns
4. **Integration APIs**: Connect with CRM and other business tools
5. **Voice Support**: Add voice interaction capabilities

## Contributing

When adding new context features:

1. Update `ChatContextMetadata` interface
2. Enhance `buildContextForAI()` method
3. Update Edge Function to handle new data
4. Add database fields if needed
5. Update documentation

## License

This enhanced chat system is part of the Nexus OS project and follows the same licensing terms. 