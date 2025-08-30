# 🏗️ Identity Setup Ticket Integration Guide

## Overview

The Identity Setup Ticket system transforms the 7 Building Blocks framework into a conversational, AI-guided workshop. Each ticket is a chat session that systematically builds complete business identity through progressive block completion.

## 🎯 **What This Achieves**

### **Before Integration**
- Static forms for business identity setup
- No conversational flow or AI guidance
- Manual progress tracking
- No integration with brain system

### **After Integration**
- **Conversational Workshop**: AI-guided identity building through natural conversation
- **Progressive Completion**: Systematic block-by-block identity establishment
- **Real-time Progress**: Live progress tracking and gamification
- **Brain Integration**: Complete identity feeds into unified brain system
- **Event-Driven**: Progress events trigger dashboard updates and notifications

## 🚀 **Quick Start**

### **1. Database Setup**

```sql
-- Run the brain tickets schema
\i docs/database/BRAIN_TICKETS_SCHEMA.sql
```

### **2. Create Identity Setup Ticket**

```tsx
import { useIdentitySetupTicket } from '@/shared/hooks/useIdentitySetupTicket';

function IdentitySetupComponent() {
  const { 
    ticket, 
    loading, 
    createTicket, 
    sendMessage,
    progress,
    currentBlock,
    isActive 
  } = useIdentitySetupTicket();

  const handleStartIdentitySetup = async () => {
    const newTicket = await createTicket();
    if (newTicket) {
      console.log('Identity setup ticket created:', newTicket.id);
    }
  };

  const handleSendMessage = async (message: string) => {
    const response = await sendMessage(message);
    if (response) {
      console.log('AI Response:', response);
    }
  };

  return (
    <div>
      {!isActive && (
        <button onClick={handleStartIdentitySetup}>
          Start Identity Setup
        </button>
      )}
      
      {isActive && (
        <div>
          <div className="progress-bar">
            Progress: {progress}% ({currentBlock})
          </div>
          {/* Chat interface */}
        </div>
      )}
    </div>
  );
}
```

### **3. Chat Integration**

```tsx
function IdentitySetupChat() {
  const { ticket, sendMessage, loading } = useIdentitySetupTicket();
  const [messages, setMessages] = useState<Array<{role: string, content: string}>>([]);
  const [inputValue, setInputValue] = useState('');

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    // Add user message
    const userMessage = { role: 'user', content: inputValue };
    setMessages(prev => [...prev, userMessage]);

    // Send to ticket service
    const aiResponse = await sendMessage(inputValue);
    
    if (aiResponse) {
      const assistantMessage = { role: 'assistant', content: aiResponse };
      setMessages(prev => [...prev, assistantMessage]);
    }

    setInputValue('');
  };

  return (
    <div className="chat-interface">
      <div className="messages">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.role}`}>
            {msg.content}
          </div>
        ))}
      </div>
      
      <div className="input-area">
        <input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type your response..."
          disabled={loading}
        />
        <button onClick={handleSend} disabled={loading}>
          Send
        </button>
      </div>
    </div>
  );
}
```

## 🏗️ **7 Building Blocks Structure**

### **Block 1: Mission & Vision**
```typescript
{
  id: 'mission',
  title: 'Mission & Vision',
  slots: [
    {
      id: 'mission_statement',
      label: 'Mission Statement',
      prompt: 'What is your company\'s mission? Why does your business exist?'
    },
    {
      id: 'vision_statement', 
      label: 'Vision Statement',
      prompt: 'What is your company\'s vision? Where do you see your business in 3-5 years?'
    }
  ]
}
```

### **Block 2: Values & Culture**
```typescript
{
  id: 'values',
  title: 'Values & Culture',
  slots: [
    {
      id: 'core_values',
      label: 'Core Values',
      prompt: 'What are your company\'s core values? (List 3-5 key values)'
    },
    {
      id: 'culture',
      label: 'Company Culture', 
      prompt: 'How would you describe your company culture?'
    }
  ]
}
```

### **Block 3: Products & Services**
```typescript
{
  id: 'offerings',
  title: 'Products & Services',
  slots: [
    {
      id: 'services',
      label: 'Services',
      prompt: 'What services does your company provide?'
    },
    {
      id: 'solutions',
      label: 'Solutions',
      prompt: 'What problems does your company solve?'
    }
  ]
}
```

### **Block 4: Clients & Markets**
```typescript
{
  id: 'market',
  title: 'Clients & Markets',
  slots: [
    {
      id: 'target_clients',
      label: 'Target Clients',
      prompt: 'Who are your ideal clients?'
    },
    {
      id: 'market_segments',
      label: 'Market Segments',
      prompt: 'What market segments do you focus on?'
    }
  ]
}
```

### **Block 5: Competitive Advantage**
```typescript
{
  id: 'advantage',
  title: 'Competitive Advantage',
  slots: [
    {
      id: 'unique_value',
      label: 'Unique Value Proposition',
      prompt: 'What makes your company unique?'
    },
    {
      id: 'competitive_edge',
      label: 'Competitive Advantages',
      prompt: 'What gives you an edge over competitors?'
    }
  ]
}
```

### **Block 6: Brand & Communication**
```typescript
{
  id: 'brand',
  title: 'Brand & Communication',
  slots: [
    {
      id: 'brand_voice',
      label: 'Brand Voice',
      prompt: 'How does your company communicate?'
    },
    {
      id: 'key_messages',
      label: 'Key Messages',
      prompt: 'What do you want people to know about your company?'
    }
  ]
}
```

### **Block 7: Goals & Objectives**
```typescript
{
  id: 'objectives',
  title: 'Goals & Objectives',
  slots: [
    {
      id: 'short_term_goals',
      label: 'Short-term Goals (3-6 months)',
      prompt: 'What are your primary goals for the next 3-6 months?'
    },
    {
      id: 'medium_term_goals',
      label: 'Medium-term Goals (6-12 months)',
      prompt: 'What are your goals for the next 6-12 months?'
    },
    {
      id: 'long_term_vision',
      label: 'Long-term Vision (1-3 years)',
      prompt: 'Where do you see your company in 1-3 years?'
    }
  ]
}
```

## 🔄 **Conversation Flow**

### **Ticket Creation**
```typescript
// 1. User triggers identity setup
const ticket = await identitySetupTicketService.createTicket(userId);

// 2. Ticket initialized with foundation data from onboarding
{
  id: 'identity_user123_1234567890',
  type: 'identity_setup',
  status: 'active',
  foundationData: {
    companyName: 'Marcoby',
    industry: 'Technology',
    size: '1-10 employees',
    role: 'Founder'
  },
  conversation: {
    currentBlock: 'mission',
    completedBlocks: [],
    totalProgress: 0
  }
}
```

### **Message Processing**
```typescript
// 3. User sends message
const response = await identitySetupTicketService.processMessage(ticketId, message);

// 4. AI processes message and updates block
{
  blockCompleted: true,
  nextBlock: 'values',
  progress: 14 // 1/7 blocks complete
}

// 5. AI generates response
"Excellent! ✅ **Mission & Vision** is now complete.

**Moving to: Values & Culture**

Define what your business stands for and how it operates

**Core Values**

What are your company's core values? What principles guide your decisions and actions? (List 3-5 key values)

(Required)"
```

### **Progress Tracking**
```typescript
// 6. Progress events emitted
{
  type: 'identity.block.completed',
  data: {
    blockId: 'mission',
    blockTitle: 'Mission & Vision'
  }
}

{
  type: 'identity.progress.updated',
  data: {
    progress: 14,
    completedBlocks: 1,
    totalBlocks: 7
  }
}
```

## 🎯 **Integration Points**

### **1. Dashboard Integration**
```tsx
// Show active identity setup tickets
const { data: activeTickets } = await selectData(
  'active_brain_tickets',
  '*',
  { user_id: userId, type: 'identity_setup' }
);

// Display progress
{ticket && (
  <div className="identity-setup-progress">
    <Progress value={ticket.calculated_progress} />
    <span>Identity Setup: {ticket.calculated_progress}%</span>
  </div>
)}
```

### **2. Brain System Integration**
```typescript
// Once identity setup is complete, activate in brain system
if (ticket.status === 'completed') {
  await onboardingBrainIntegration.activateBusinessIdentity(ticket.data);
  
  // Emit completion event
  emitEvent('identity.setup.completed', {
    userId: ticket.userId,
    identityData: ticket.data
  });
}
```

### **3. Notification System**
```typescript
// Progress notifications
if (progress >= 25 && progress < 50) {
  showNotification('Great progress! You\'re building a solid foundation.');
}

if (progress >= 50 && progress < 75) {
  showNotification('Halfway there! Your business identity is taking shape.');
}

if (progress >= 75 && progress < 100) {
  showNotification('Almost done! Just a few more details to complete your identity.');
}
```

## 🚀 **Implementation Checklist**

- [ ] **Database Setup**
  - [ ] Run brain tickets schema
  - [ ] Verify table creation and indexes
  - [ ] Test database functions

- [ ] **Service Integration**
  - [ ] Import IdentitySetupTicketService
  - [ ] Test ticket creation and message processing
  - [ ] Verify progress calculation

- [ ] **React Integration**
  - [ ] Import useIdentitySetupTicket hook
  - [ ] Create identity setup component
  - [ ] Implement chat interface
  - [ ] Add progress visualization

- [ ] **Brain System Integration**
  - [ ] Connect completed tickets to brain system
  - [ ] Test identity data activation
  - [ ] Verify AI context enhancement

- [ ] **Event System**
  - [ ] Implement progress event handling
  - [ ] Add dashboard updates
  - [ ] Test notification triggers

- [ ] **Testing**
  - [ ] Test complete conversation flow
  - [ ] Verify progress tracking
  - [ ] Test data persistence
  - [ ] Validate brain integration

## 🎉 **Result**

Your Identity Setup is now a **conversational, AI-guided workshop** that:

- ✅ **Feels Natural**: Conversational flow, not form-filling
- ✅ **Ensures Completeness**: No skipped blocks, systematic progression
- ✅ **Tracks Progress**: Real-time progress with gamification
- ✅ **Integrates Seamlessly**: Complete identity feeds brain system
- ✅ **Scales Easily**: Same pattern works for Revenue Setup, Cashflow Setup, etc.

The Identity Setup Ticket transforms business identity establishment from a static process into an **engaging, intelligent conversation** that builds the foundation for all future Nexus AI interactions.
