# FIRE Cycle System - Quick Start Guide

The FIRE Cycle System is now integrated into Nexus! This system automatically detects when you're expressing ideas, goals, or initiatives in the AI chat and helps you develop them into actionable plans.

## 🚀 How to Get Started

### 1. Access the Demo
Visit `/fire-cycle-demo` to test the FIRE Cycle System in action.

### 2. Try These Example Prompts

**Focus Phase (Clarifying goals):**
- "I want to start a blog about technology"
- "We need to improve our customer service"
- "I'm thinking about launching a new product"

**Insight Phase (Understanding context):**
- "This is a great opportunity for our business"
- "I believe we should focus on mobile users"
- "We could expand into the European market"

**Roadmap Phase (Planning):**
- "I plan to launch the product next month"
- "We're planning to expand to three new markets"
- "Let's implement this new feature"

**Execute Phase (Taking action):**
- "I'm going to start working on this tomorrow"
- "We will implement this feature next week"
- "I'm starting the development process"

### 3. What Happens When You Share an Idea

1. **Detection** - The system analyzes your message for trigger phrases
2. **Categorization** - Your idea is classified into one of the FIRE phases
3. **Insights** - You'll see relevant insights and suggested actions
4. **Thought Creation** - You can create a structured thought to track your idea
5. **Development** - Follow the suggested actions to develop your idea

## 🔥 The FIRE Phases

### Focus
- **Purpose:** Clarify the core idea or goal
- **Triggers:** "I want", "We need", "I should"
- **Example:** "I want to start a blog about technology"

### Insight
- **Purpose:** Gain deeper understanding and context
- **Triggers:** "This is", "I believe", "We could"
- **Example:** "This is a great opportunity for our business"

### Roadmap
- **Purpose:** Plan the path forward
- **Triggers:** "I plan", "We're planning", "Let's"
- **Example:** "I plan to launch the product next month"

### Execute
- **Purpose:** Take action and implement
- **Triggers:** "I'm going to", "We will", "I'm starting"
- **Example:** "I'm going to start working on this tomorrow"

## 📊 Tracking Your Ideas

The demo page shows:
- **Statistics** - How many ideas you've captured in each phase
- **Thought List** - All your captured ideas with their status
- **Progress Tracking** - Visual indicators of idea development

## 🎯 Benefits

### For Individuals
- **Never lose ideas** - All thoughts are automatically captured
- **Structured development** - Clear path from idea to action
- **Progress tracking** - See your ideas evolve through phases
- **Actionable insights** - Get specific next steps for each idea

### For Teams
- **Shared idea repository** - Collaborate on idea development
- **Strategic alignment** - Connect ideas to business goals
- **Resource planning** - Assess effort and impact of ideas
- **Innovation pipeline** - Systematic idea management

## 🔧 Technical Details

### Integration Points
- **AI Chat System** - Seamlessly integrated with existing chat
- **Database Storage** - Thoughts stored in Supabase
- **React Components** - Modern, responsive UI
- **Real-time Analysis** - Instant detection and categorization

### Configuration Options
```typescript
const {
  analyzeMessage,
  createThoughtFromMessage
} = useFireCycleChatIntegration({
  autoTrigger: true,           // Enable automatic detection
  confidenceThreshold: 0.7,    // Minimum confidence for triggers
  enableNotifications: true     // Show notifications
});
```

## 🚀 Next Steps

1. **Try the Demo** - Visit `/fire-cycle-demo` and test with example prompts
2. **Capture Your First Idea** - Express an idea in the chat interface
3. **Follow the Guidance** - Use the suggested actions to develop your idea
4. **Track Progress** - Monitor your ideas as they move through phases

## 📚 Documentation

For detailed technical documentation, see:
- `docs/FIRE_CYCLE_SYSTEM.md` - Comprehensive system documentation
- `src/core/fire-cycle/` - Core system implementation
- `src/components/ai/` - React components

## 🆘 Support

If you have questions or need help:
1. Check the demo page for examples
2. Review the configuration options
3. Contact the development team

---

**The FIRE Cycle System transforms casual conversations into structured idea development, helping you turn thoughts into reality!** 🔥 