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

// Model-Way Framework Constants: Nexus Jumpstart Edition
const INTENT_TYPES = {
  PROGRESS: { id: 'progress', name: '📈 Progress', emoji: '📈', description: 'Summarize status, progress, and next actions' },
  PERFORMANCE: { id: 'performance', name: '📊 Performance', emoji: '📊', description: 'Analyze metrics, KPIs, and business outcomes' },
  GROWTH: { id: 'growth', name: '🚀 Growth', emoji: '🚀', description: 'Identify growth opportunities and strategic paths' },
  ASSIST: { id: 'assist', name: '🤝 Assist', emoji: '🤝', description: 'General assistance, tasks, and problem solving' },
  SWITCH: { id: 'switch', name: '🔄 Switch', emoji: '🔄', description: 'Switch to a different conversation topic' }
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

  // Jumpstart-aligned intent detection (Strategic & External first)
  if (lastMessage.includes('growth') || lastMessage.includes('opportunity') || lastMessage.includes('strategy') || lastMessage.includes('scale') || lastMessage.includes('current events') || lastMessage.includes('news') || lastMessage.includes('synthesis')) {
    return INTENT_TYPES.GROWTH;
  }
  if (lastMessage.includes('continue this:') || lastMessage.includes('switch to:')) {
    return INTENT_TYPES.SWITCH;
  }
  if (lastMessage.includes('performance') || lastMessage.includes('metric') || lastMessage.includes('analysis') || lastMessage.includes('results') || lastMessage.includes('kpi') || lastMessage.includes('trends')) {
    return INTENT_TYPES.PERFORMANCE;
  }
  if (lastMessage.includes('summarize') || lastMessage.includes('progress') || lastMessage.includes('status') || lastMessage.includes('milestone') || lastMessage.includes('what was i working on')) {
    return INTENT_TYPES.PROGRESS;
  }
  if (lastMessage.includes('help') || lastMessage.includes('assist') || lastMessage.includes('do') || lastMessage.includes('task')) {
    return INTENT_TYPES.ASSIST;
  }

  // Fallback to Progress/Assist for new conversations depending on context
  return messages.length <= 1 ? INTENT_TYPES.PROGRESS : INTENT_TYPES.ASSIST;
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
    [INTENT_TYPES.PROGRESS.id]: `Intent: Progress Tracking
- Synthesize recent updates and milestones
- Highlight completed tasks vs. pending items
- Clearly outline "Next Actions"
- Maintain a proactive, organizational tone`,

    [INTENT_TYPES.PERFORMANCE.id]: `Intent: Performance Analysis
- Deep dive into data, metrics, and trends
- Identify patterns (positive or negative)
- Compare against benchmarks or goals
- Use structured data presentation (lists, summaries)`,

    [INTENT_TYPES.GROWTH.id]: `Intent: Strategic Growth
- Look for untapped opportunities
- Suggest scaling strategies
- Analyze competitive advantages
- Focus on long-term value and expansion`,

    [INTENT_TYPES.ASSIST.id]: `Intent: General Assistance
- Execute specific user tasks efficiently
- Solve immediate problems or blockers
- Act as a versatile executive assistant
- Focus on accuracy and speed`
  };

  const contextAnchors = `
CONTEXTUAL ANCHORS (SYNTHESIS REQUIRED):
- Current Goals: [Extracted from User Profile & Business Identity]
- Recent Work: [Extracted from Brain Tickets & Milestone Updates]
- Integration Trends: [Extracted from Connected Tool Output History]

SYNTHESIS INSTRUCTIONS:
1. Targeted Research: When the user asks for "news", "current events", or to "look up [topic]", prioritize using the web_search tool to find developments and documentation relevant to their INDUSTRY and STATED GOALS.
2. Link the Dots: Do not just list events or facts. Synthesize HOW external info and recent work impact their long-term objectives.
3. Evidence & Sources: For every news item, trend, or supporting fact mentioned, PROVIDE A CLICKABLE LINK (Markdown format) to the source article or reference.
4. Be Proactive: If a trend or event poses a risk or opportunity for a "Stated Goal", call it out explicitly.`;

  return `${basePrompt}

${contextAnchors}

${phasePrompts[phase]}

${intentPrompts[intent.id]}

Remember: You're using the Model-Way Framework to teach effective AI collaboration and provide a high-level Executive Synthesis.`;
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
    // Filter out any existing system messages to avoid confusion/duplication
    const userMessages = messages.filter(m => m.role !== 'system');

    const enhancedMessages = [
      { role: 'system', content: systemPrompt },
      ...userMessages
    ];

    console.log(`[Model-Way] Calling OpenClaw Engine (Phase: ${phase}, Intent: ${intent.name})`);

    // Call Real OpenClaw Engine
    // We use the internal Docker DNS or localhost depending on how this script is running
    // If running in container: http://openclaw:18789/v1
    // If running on host: http://localhost:18789/v1
    const openClawUrl = process.env.OPENCLAW_API_URL || 'http://localhost:18789/v1';

    const response = await fetch(`${openClawUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENCLAW_API_KEY || 'sk-openclaw-local'}`
      },
      body: JSON.stringify({
        messages: enhancedMessages,
        model: process.env.OPENCLAW_MODEL || 'openclaw-default',
        temperature: 0.7,
        user: userId
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenClaw Engine Error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || 'No response generated.';

    return structureResponse(content, intent, phase, conversationId);

  } catch (error) {
    console.error('Model-Way processing failed:', error);

    // Fallback if engine is down, but still mark as "Model-Way" to show the framework is active
    return structureResponse(
      `⚠️ **Connection Error**\n\nI successfully analyzed your intent (${intent?.name || 'Unknown'}) and phase (${phase || 'Unknown'}), but the OpenClaw Engine is currently unreachable.\n\nError: ${error.message}\n\nPlease ensure OpenClaw is running at port 18789.`,
      intent || INTENT_TYPES.BRAINSTORM,
      phase || PHASES.DISCOVERY,
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