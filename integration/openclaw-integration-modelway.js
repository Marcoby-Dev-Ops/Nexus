#!/usr/bin/env node
/**
 * OpenClaw Integration Service with Model-Way Framework
 * Implements Nexus's Model-Way Framework for structured AI collaboration
 */

const express = require('express');
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');

const execAsync = promisify(exec);

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 18790;
const OPENCLAW_BIN = process.env.OPENCLAW_BIN || 'openclaw';
const WORKSPACE_DIR = process.env.WORKSPACE_DIR || '/root/.openclaw/workspace';

// Model-Way Framework Constants
const INTENT_TYPES = {
  BRAINSTORM: { id: 'brainstorm', name: '🧠 Brainstorm', emoji: '🧠', description: 'Generate ideas, explore possibilities' },
  SOLVE: { id: 'solve', name: '🛠 Solve', emoji: '🛠', description: 'Solve a problem, debug, fix issues' },
  WRITE: { id: 'write', name: '✍️ Write', emoji: '✍️', description: 'Draft content, emails, documents' },
  DECIDE: { id: 'decide', name: '📊 Decide', emoji: '📊', description: 'Make decisions, analyze options' },
  LEARN: { id: 'learn', name: '📚 Learn', emoji: '📚', description: 'Learn, research, understand concepts' }
};

const PHASES = {
  DISCOVERY: 'discovery',
  SYNTHESIS: 'synthesis', 
  DECISION: 'decision',
  EXECUTION: 'execution'
};

// In-memory conversation tracking (in production, use database)
const conversations = new Map();

/**
 * Model-Way: Detect intent from messages
 */
function detectIntent(messages) {
  const lastMessage = messages[messages.length - 1]?.content?.toLowerCase() || '';
  
  // Simple keyword-based intent detection
  if (lastMessage.includes('brainstorm') || lastMessage.includes('idea') || lastMessage.includes('creative')) {
    return INTENT_TYPES.BRAINSTORM;
  }
  if (lastMessage.includes('solve') || lastMessage.includes('problem') || lastMessage.includes('fix') || lastMessage.includes('debug')) {
    return INTENT_TYPES.SOLVE;
  }
  if (lastMessage.includes('write') || lastMessage.includes('draft') || lastMessage.includes('email') || lastMessage.includes('document')) {
    return INTENT_TYPES.WRITE;
  }
  if (lastMessage.includes('decide') || lastMessage.includes('choose') || lastMessage.includes('option') || lastMessage.includes('analysis')) {
    return INTENT_TYPES.DECIDE;
  }
  if (lastMessage.includes('learn') || lastMessage.includes('research') || lastMessage.includes('understand') || lastMessage.includes('explain')) {
    return INTENT_TYPES.LEARN;
  }
  
  // Default to brainstorming for new conversations
  return INTENT_TYPES.BRAINSTORM;
}

/**
 * Model-Way: Determine current phase based on conversation
 */
function determinePhase(conversationId, messages) {
  const conversation = conversations.get(conversationId) || { phase: PHASES.DISCOVERY, messageCount: 0 };
  
  // Simple phase progression based on message count
  const messageCount = messages.length;
  
  if (messageCount <= 2) return PHASES.DISCOVERY;
  if (messageCount <= 4) return PHASES.SYNTHESIS;
  if (messageCount <= 6) return PHASES.DECISION;
  return PHASES.EXECUTION;
}

/**
 * Model-Way: Scaffold system prompt based on intent and phase
 */
function scaffoldSystemPrompt(intent, phase, userId) {
  const basePrompt = `You are a Nexus AI assistant using the Model-Way Framework.

User: ${userId}
Intent: ${intent.name} (${intent.description})
Current Phase: ${phase.charAt(0).toUpperCase() + phase.slice(1)}

Please structure your response according to the Model-Way Framework.`;

  const phasePrompts = {
    [PHASES.DISCOVERY]: `We're in the Discovery phase. Focus on:
- Asking clarifying questions
- Exploring the problem space
- Identifying key variables and constraints
- Gathering initial insights

Keep responses exploratory and open-ended.`,
    
    [PHASES.SYNTHESIS]: `We're in the Synthesis phase. Focus on:
- Organizing information and patterns
- Connecting dots between insights
- Identifying core principles or themes
- Preparing for decision-making

Structure your response with clear sections and summaries.`,
    
    [PHASES.DECISION]: `We're in the Decision phase. Focus on:
- Presenting clear options with pros/cons
- Making recommendations with rationale
- Assessing risks and opportunities
- Providing actionable next steps

Be decisive and recommendation-oriented.`,
    
    [PHASES.EXECUTION]: `We're in the Execution phase. Focus on:
- Concrete action steps
- Timeline and responsibilities
- Success metrics and checkpoints
- Potential obstacles and solutions

Be specific, actionable, and practical.`
  };
  
  const intentPrompts = {
    [INTENT_TYPES.BRAINSTORM.id]: `Intent: Brainstorming
- Generate diverse ideas without judgment
- Encourage creative thinking
- Build on ideas with "yes, and..."
- Quantity over quality initially`,
    
    [INTENT_TYPES.SOLVE.id]: `Intent: Problem Solving
- Define the problem clearly
- Analyze root causes
- Generate potential solutions
- Evaluate and recommend best approach`,
    
    [INTENT_TYPES.WRITE.id]: `Intent: Writing
- Understand audience and purpose
- Structure content logically
- Use appropriate tone and style
- Provide drafts with clear next steps`,
    
    [INTENT_TYPES.DECIDE.id]: `Intent: Decision Making
- Frame the decision clearly
- Identify criteria for evaluation
- Analyze options objectively
- Make and justify recommendations`,
    
    [INTENT_TYPES.LEARN.id]: `Intent: Learning
- Assess current knowledge level
- Provide clear explanations
- Use examples and analogies
- Suggest resources for deeper learning`
  };
  
  return `${basePrompt}

${phasePrompts[phase]}

${intentPrompts[intent.id]}

Remember: You're using the Model-Way Framework to teach effective AI collaboration.`;
}

/**
 * Model-Way: Structure the response with metadata
 */
function structureResponse(content, intent, phase, conversationId) {
  const phaseProgress = {
    [PHASES.DISCOVERY]: 25,
    [PHASES.SYNTHESIS]: 50,
    [PHASES.DECISION]: 75,
    [PHASES.EXECUTION]: 100
  };
  
  return {
    content,
    metadata: {
      modelWay: {
        intent: {
          id: intent.id,
          name: intent.name,
          emoji: intent.emoji,
          description: intent.description
        },
        phase: {
          id: phase,
          name: phase.charAt(0).toUpperCase() + phase.slice(1),
          progress: phaseProgress[phase] || 0
        },
        conversationId,
        timestamp: new Date().toISOString()
      }
    }
  };
}

/**
 * Call OpenClaw with Model-Way scaffolding
 */
async function callOpenClawWithModelWay(messages, userId, conversationId) {
  try {
    // Model-Way processing
    const intent = detectIntent(messages);
    const phase = determinePhase(conversationId, messages);
    const systemPrompt = scaffoldSystemPrompt(intent, phase, userId);
    
    // Update conversation tracking
    conversations.set(conversationId, {
      intent,
      phase,
      messageCount: messages.length,
      lastUpdated: new Date().toISOString()
    });
    
    // Build enhanced messages with system prompt
    const enhancedMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];
    
    // Extract last user message for simulation
    const lastUserMessage = messages
      .filter(m => m.role === 'user')
      .slice(-1)[0]?.content || '';
    
    // Simulate OpenClaw response with Model-Way structure
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const responseTemplates = {
      [INTENT_TYPES.BRAINSTORM.id]: `🧠 **Brainstorming Session** (${phase} phase)

Based on your request: "${lastUserMessage.substring(0, 100)}..."

**Ideas Generated:**
1. Idea A: [Description]
2. Idea B: [Description] 
3. Idea C: [Description]

**Next Phase Actions:**
- Which idea resonates most?
- Should we dive deeper into any of these?
- Need more variations or constraints?

*Model-Way Framework: Using structured brainstorming to generate creative options.*`,
      
      [INTENT_TYPES.SOLVE.id]: `🛠 **Problem Solving** (${phase} phase)

Problem: "${lastUserMessage.substring(0, 100)}..."

**Analysis:**
- Root causes identified: [List]
- Constraints: [List]
- Available resources: [List]

**Potential Solutions:**
1. Solution A: [Description with pros/cons]
2. Solution B: [Description with pros/cons]

**Recommended Approach:** [Based on ${phase} phase analysis]

*Model-Way Framework: Systematic problem-solving with clear phases.*`,
      
      [INTENT_TYPES.WRITE.id]: `✍️ **Writing Assistance** (${phase} phase)

Writing task: "${lastUserMessage.substring(0, 100)}..."

**Structure Outline:**
1. Introduction: [Key points]
2. Main sections: [Breakdown]
3. Conclusion: [Summary]

**Tone & Style:** Professional/Business

**Draft Snippet:** [Example paragraph]

**Next Steps:** Review, revise, or proceed to next section?

*Model-Way Framework: Structured writing process for better outcomes.*`,
      
      [INTENT_TYPES.DECIDE.id]: `📊 **Decision Making** (${phase} phase)

Decision to make: "${lastUserMessage.substring(0, 100)}..."

**Decision Criteria:**
1. [Criterion 1]
2. [Criterion 2]
3. [Criterion 3]

**Options Analysis:**
- Option A: [Analysis]
- Option B: [Analysis]
- Option C: [Analysis]

**Recommendation:** [Based on ${phase} phase evaluation]

*Model-Way Framework: Data-driven decision process.*`,
      
      [INTENT_TYPES.LEARN.id]: `📚 **Learning Session** (${phase} phase)

Learning goal: "${lastUserMessage.substring(0, 100)}..."

**Key Concepts:**
1. [Concept 1 with explanation]
2. [Concept 2 with explanation]
3. [Concept 3 with explanation]

**Examples & Applications:**
- [Example 1]
- [Example 2]

**Check Understanding:**
- Question 1: [To test comprehension]
- Question 2: [To test application]

*Model-Way Framework: Structured learning for deeper understanding.*`
    };
    
    const responseContent = responseTemplates[intent.id] || `**Nexus Model-Way Framework**
    
Intent: ${intent.name}
Phase: ${phase}
    
Your request is being processed with structured AI collaboration.
    
This demonstrates the Model-Way Framework in action.`;
    
    return structureResponse(responseContent, intent, phase, conversationId);
    
  } catch (error) {
    console.error('Model-Way processing failed:', error);
    return structureResponse(
      `I'm your Nexus AI assistant using the Model-Way Framework.\n\n**Integration Status**: Model-Way Framework active\n**Next**: Real OpenClaw integration coming soon.\n\nHow can I help with structured collaboration today?`,
      INTENT_TYPES.BRAINSTORM,
      PHASES.DISCOVERY,
      conversationId
    );
  }
}

// Health endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'openclaw-integration-modelway',
    version: '1.0.0',
    modelWay: true,
    intents: Object.values(INTENT_TYPES).map(i => ({ id: i.id, name: i.name, emoji: i.emoji })),
    phases: Object.values(PHASES),
    endpoints: ['/v1/chat/completions', '/v1/health', '/health', '/v1/modelway/intents']
  });
});

app.get('/v1/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'openclaw-integration-modelway',
    version: '1.0.0',
    modelWay: true
  });
});

// Get Model-Way intents
app.get('/v1/modelway/intents', (req, res) => {
  res.json({
    intents: Object.values(INTENT_TYPES),
    phases: Object.values(PHASES),
    framework: 'Model-Way Framework v1.0'
  });
});

/**
 * OpenAI-compatible chat completions with Model-Way Framework
 */
app.post('/v1/chat/completions', async (req, res) => {
  try {
    const { messages, model, user, conversationId: providedConvId } = req.body;
    
    const userId = user || 'anonymous';
    const conversationId = providedConvId || `conv-${userId}-${Date.now()}`;
    
    console.log('Model-Way Chat Request:', {
      conversationId,
      userId,
      messageCount: messages?.length,
      model
    });
    
    if (!messages || messages.length === 0) {
      return res.status(400).json({
        error: {
          message: 'messages array is required',
          type: 'invalid_request_error'
        }
      });
    }
    
    // Process with Model-Way Framework
    const { content, metadata } = await callOpenClawWithModelWay(messages, userId, conversationId);
    
    // Format as OpenAI-compatible response
    const response = {
      id: 'chatcmpl-' + Date.now(),
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: model || 'openclaw-modelway-1.0',
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: content
          },
          finish_reason: 'stop'
        }
      ],
      usage: {
        prompt_tokens: Math.ceil(JSON.stringify(messages).length / 4),
        completion_tokens: Math.ceil(content.length / 4),
        total_tokens: Math.ceil((JSON.stringify(messages).length + content.length) / 4)
      },
      // Include Model-Way metadata in response
      nexus_metadata: metadata
    };
    
    console.log('Model-Way Response Generated:', {
      conversationId,
      intent: metadata.modelWay.intent.name,
      phase: metadata.modelWay.phase.name
    });
    
    res.json(response);
    
  } catch (error) {
    console.error('Model-Way Integration error:', error);
    res.status(500).json({
      error: {
        message: error.message,
        type: 'internal_server_error'
      }
    });
  }
});

/**
 * Test endpoint showcasing Model-Way Framework
 */
app.get('/v1/modelway/demo', async (req, res) => {
  try {
    const testMessages = [
      { role: 'user', content: 'I need help deciding which marketing strategy to use for our new product.' }
    ];
    
    const { content, metadata } = await callOpenClawWithModelWay(
      testMessages, 
      'demo-user', 
      'demo-conversation'
    );
    
    res.json({
      success: true,
      demo: 'modelway-framework',
      response: content,
      metadata,
      framework: {
        name: 'Model-Way Framework',
        description: 'Structured AI collaboration framework',
        version: '1.0.0'
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      demo: 'modelway-framework'
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 OpenClaw Integration with Model-Way Framework`);
  console.log(`📡 Port: ${PORT}`);
  console.log(`📊 Health: http://localhost:${PORT}/health`);
  console.log(`🤖 OpenAI API: POST http://localhost:${PORT}/v1/chat/completions`);
  console.log(`🧠 Model-Way Intents: GET http://localhost:${PORT}/v1/modelway/intents`);
  console.log(`🎯 Demo: GET http://localhost:${PORT}/v1/modelway/demo`);
  console.log(`\n🔧 Model-Way Framework Features:`);
  console.log(`- Intent detection: ${Object.values(INTENT_TYPES).map(i => i.emoji).join(' ')}`);
  console.log(`- Phase tracking: ${Object.values(PHASES).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' → ')}`);
  console.log(`- Structured scaffolding`);
  console.log(`- Conversation metadata`);
  console.log(`\n🔗 For Nexus: OPENCLAW_API_URL=http://localhost:${PORT}/v1`);
});