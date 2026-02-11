# FIRE Cycle System

The FIRE Cycle System is a comprehensive idea capture and development framework integrated into Nexus that helps users transform their thoughts into actionable plans through a structured four-phase process.

## Overview

The FIRE Cycle System automatically analyzes user messages in the AI chat interface and identifies when users are expressing ideas, goals, or initiatives. When detected, the system categorizes these into one of four phases and provides structured guidance for development.

### FIRE Phases

1. **Focus** - Clarifying the core idea or goal
2. **Insight** - Gaining deeper understanding and context  
3. **Roadmap** - Planning the path forward
4. **Execute** - Taking action and implementing

## How It Works

### 1. Message Analysis

The system monitors AI chat messages for trigger phrases that indicate ideas or goals:

**Focus Phase Triggers:**
- "I want to..."
- "We need to..."
- "I should..."
- "I'm thinking about..."

**Insight Phase Triggers:**
- "This is..."
- "That is..."
- "I believe..."
- "We could..."

**Roadmap Phase Triggers:**
- "I plan to..."
- "We're planning..."
- "Let's..."
- "We should..."

**Execute Phase Triggers:**
- "I'm going to..."
- "We will..."
- "I'm starting..."
- "Let's begin..."

### 2. Confidence Scoring

Each message is analyzed and assigned a confidence score (0-1) based on:
- Presence of trigger phrases
- Clarity of the statement
- Specificity of the goal
- Action-oriented language

### 3. Thought Creation

When a message meets the confidence threshold (default: 0.7), the system:
- Creates a structured thought record
- Categorizes it by FIRE phase
- Generates suggested next steps
- Provides actionable insights

## Components

### Core System Files

- `src/core/fire-cycle/fireCycleChatIntegration.ts` - Main integration logic
- `src/core/fire-cycle/fireCycleProcessor.ts` - FIRE cycle processing engine
- `src/core/fire-cycle/fireCycleLogic.ts` - Business logic and phase detection

### React Components

- `src/components/ai/FireCycleChatInterface.tsx` - Main chat interface
- `src/components/ai/FireCycleInsights.tsx` - Insights display component
- `src/hooks/useFireCycleChatIntegration.ts` - React hook for integration

### Services

- `src/services/help-center/thoughtsService.ts` - CRUD operations for thoughts

## Usage Examples

### Starting a Blog

**User Input:** "I want to start a blog about technology"

**System Response:**
- **Phase:** Focus
- **Confidence:** 0.85
- **Insights:** 
  - Clear goal identification
  - Specific topic area defined
  - Action-oriented language
- **Suggested Actions:**
  - Research blogging platforms
  - Define target audience
  - Create content calendar
  - Set up domain and hosting

### Improving Customer Service

**User Input:** "We need to improve our customer service"

**System Response:**
- **Phase:** Focus  
- **Confidence:** 0.78
- **Insights:**
  - Business improvement goal
  - Team-oriented language
  - General area identified
- **Suggested Actions:**
  - Conduct customer feedback survey
  - Analyze current service metrics
  - Identify pain points
  - Develop improvement plan

## Integration with AI Chat

The FIRE Cycle System seamlessly integrates with the existing AI chat system:

1. **Automatic Detection** - Messages are analyzed in real-time
2. **Non-Intrusive** - Regular chat continues normally
3. **Optional Engagement** - Users can choose to create thoughts or dismiss insights
4. **Progressive Development** - Thoughts can be updated and developed over time

## Thought Development Workflow

### 1. Capture
- User expresses idea in chat
- System detects and categorizes
- User chooses to create thought

### 2. Develop
- System provides structured guidance
- User adds context and details
- Progress tracked through phases

### 3. Execute
- Action items generated
- Timeline established
- Progress monitored

### 4. Iterate
- Updates from subsequent conversations
- Refinement of plans
- New insights incorporated

## Configuration Options

The system can be configured through the `useFireCycleChatIntegration` hook:

```typescript
const {
  analyzeMessage,
  createThoughtFromMessage,
  // ... other methods
} = useFireCycleChatIntegration({
  autoTrigger: true,           // Enable automatic detection
  confidenceThreshold: 0.7,    // Minimum confidence for triggers
  enableNotifications: true     // Show notifications
});
```

## Database Schema

Thoughts are stored with the following structure:

```typescript
interface Thought {
  id: string;
  content: string;
  category: string;
  status: 'concept' | 'developing' | 'active' | 'completed';
  firePhase: 'focus' | 'insight' | 'roadmap' | 'execute';
  confidence: number;
  priority: 'low' | 'medium' | 'high';
  estimatedEffort: string;
  impact: string;
  companyId: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}
```

## Benefits

### For Users
- **Idea Capture** - Never lose important thoughts
- **Structured Development** - Clear path from idea to action
- **Progress Tracking** - Visual progress through phases
- **Collaboration** - Share and develop ideas with team

### For Businesses
- **Innovation Pipeline** - Systematic idea management
- **Resource Planning** - Effort and impact assessment
- **Knowledge Retention** - Persistent idea storage
- **Strategic Alignment** - Connect ideas to business goals

## Future Enhancements

### Planned Features
- **AI-Powered Suggestions** - Enhanced action recommendations
- **Team Collaboration** - Multi-user thought development
- **Integration APIs** - Connect with project management tools
- **Analytics Dashboard** - Track idea development metrics
- **Templates** - Pre-built development frameworks

### Advanced Capabilities
- **Natural Language Processing** - More sophisticated trigger detection
- **Context Awareness** - Learn from user patterns
- **Predictive Analytics** - Suggest optimal development paths
- **Integration Ecosystem** - Connect with external tools

## Getting Started

1. **Access the Demo** - Visit `/fire-cycle-demo` to test the system
2. **Try Example Prompts** - Use the provided examples to see the system in action
3. **Create Your First Thought** - Express an idea and see it captured
4. **Develop Your Ideas** - Follow the suggested actions and insights

## Support

For questions or issues with the FIRE Cycle System:
- Check the demo page for examples
- Review the configuration options
- Contact the development team for advanced features

The FIRE Cycle System transforms casual conversations into structured idea development, helping users and businesses turn thoughts into reality. 