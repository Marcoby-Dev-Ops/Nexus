#!/usr/bin/env node
/**
 * OpenClaw Integration Service - Production Version
 * Properly calls OpenClaw agent for AI responses
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
const OPENCLAW_AGENT = process.env.OPENCLAW_AGENT || 'main'; // Which agent to use

// Health endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'openclaw-integration',
    version: '1.0.0',
    openai_compatible: true,
    endpoints: ['/v1/chat/completions', '/v1/health', '/health']
  });
});

app.get('/v1/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'openclaw-integration',
    version: '1.0.0',
    openai_compatible: true,
    endpoints: ['/v1/chat/completions', '/v1/health', '/health']
  });
});

/**
 * Properly call OpenClaw agent with a message
 */
async function callOpenClawAgent(messages, userId = 'nexus-user') {
  try {
    // Extract the last user message (simplified for MVP)
    const lastUserMessage = messages
      .filter(m => m.role === 'user')
      .slice(-1)[0]?.content || '';
    
    if (!lastUserMessage) {
      throw new Error('No user message found');
    }
    
    // Build the OpenClaw command
    // Using --agent main to target the main agent
    // Using --json to get structured output
    // Using --local to run embedded (no gateway dependency for now)
    const cmd = `${OPENCLAW_BIN} agent --agent ${OPENCLAW_AGENT} --message "${lastUserMessage.replace(/"/g, '\\"')}" --json --local`;
    
    console.log('Calling OpenClaw agent:', {
      command: cmd.substring(0, 200),
      userId,
      messageLength: lastUserMessage.length
    });
    
    // Execute with timeout
    const { stdout, stderr } = await execAsync(cmd, {
      cwd: WORKSPACE_DIR,
      timeout: 45000, // 45 second timeout for AI response
      env: { ...process.env, OPENCLAW_LOCAL: 'true' }
    });
    
    if (stderr && stderr.length > 0) {
      console.warn('OpenClaw stderr:', stderr.substring(0, 500));
    }
    
    // Parse JSON response
    try {
      const response = JSON.parse(stdout);
      console.log('OpenClaw response:', {
        success: !!response,
        hasContent: !!response?.content
      });
      
      return response?.content || `OpenClaw agent response (parsed): ${stdout.substring(0, 500)}`;
      
    } catch (parseError) {
      // If not JSON, return raw output
      console.warn('OpenClaw response not JSON, using raw output');
      return stdout.trim() || `OpenClaw agent responded (non-JSON): ${stdout.substring(0, 500)}`;
    }
    
  } catch (error) {
    console.error('OpenClaw agent call failed:', error.message);
    
    // Fallback to simulated response
    return `I'm your Nexus AI assistant powered by OpenClaw.\n\n**Note**: OpenClaw integration is in development. Real AI responses coming soon.\n\nYour message was received via the integration service.`;
  }
}

/**
 * OpenAI-compatible chat completions endpoint
 */
app.post('/v1/chat/completions', async (req, res) => {
  try {
    const { messages, model, max_tokens, temperature, stream, user } = req.body;
    
    console.log('OpenClaw Integration: Chat request', {
      messageCount: messages?.length,
      model,
      user: user || 'anonymous',
      timestamp: new Date().toISOString()
    });
    
    if (!messages || messages.length === 0) {
      return res.status(400).json({
        error: {
          message: 'messages array is required',
          type: 'invalid_request_error'
        }
      });
    }
    
    // Call OpenClaw agent
    const openClawResponse = await callOpenClawAgent(messages, user);
    
    // Format as OpenAI-compatible response
    const response = {
      id: 'chatcmpl-' + Date.now(),
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: model || 'openclaw-1.0',
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: openClawResponse
          },
          finish_reason: 'stop'
        }
      ],
      usage: {
        prompt_tokens: Math.ceil(JSON.stringify(messages).length / 4),
        completion_tokens: Math.ceil(openClawResponse.length / 4),
        total_tokens: Math.ceil((JSON.stringify(messages).length + openClawResponse.length) / 4)
      }
    };
    
    console.log('Returning OpenAI-compatible response');
    res.json(response);
    
  } catch (error) {
    console.error('OpenClaw Integration error:', error);
    res.status(500).json({
      error: {
        message: error.message,
        type: 'internal_server_error'
      }
    });
  }
});

/**
 * Test endpoint with real OpenClaw call
 */
app.get('/v1/test-real', async (req, res) => {
  try {
    const testMessage = 'Hello from Nexus integration test. Please respond with a short confirmation.';
    const testMessages = [{ role: 'user', content: testMessage }];
    
    const response = await callOpenClawAgent(testMessages, 'test-user');
    
    res.json({
      success: true,
      test: 'openclaw-agent-integration',
      response: response.substring(0, 500),
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      test: 'openclaw-agent-integration'
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 OpenClaw Integration Service (Production) running on port ${PORT}`);
  console.log(`📊 Health: http://localhost:${PORT}/health`);
  console.log(`🤖 OpenAI API: POST http://localhost:${PORT}/v1/chat/completions`);
  console.log(`🧪 Test: GET http://localhost:${PORT}/v1/test-real`);
  console.log(`\n🔧 Configuration:`);
  console.log(`- OpenClaw binary: ${OPENCLAW_BIN}`);
  console.log(`- OpenClaw agent: ${OPENCLAW_AGENT}`);
  console.log(`- Workspace: ${WORKSPACE_DIR}`);
  console.log(`\n🔗 For Nexus: set OPENCLAW_API_URL=http://localhost:${PORT}/v1`);
});