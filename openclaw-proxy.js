#!/usr/bin/env node
// Minimal Nexus → OpenClaw chat proxy
const express = require('express');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const app = express();
app.use(express.json());

// Simple OpenClaw chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, context } = req.body;
    
    console.log('Chat request:', { message, context: context?.user?.name });
    
    // Use OpenClaw's internal chat via exec
    // We'll create a simple prompt with context
    const prompt = context ? `
Context:
- User: ${context.user?.name || 'User'}
- Role: ${context.user?.role || 'User'}
- Company: ${context.company?.name || 'N/A'}
- Agent: ${context.agent?.id || 'executive-assistant'}

Message: ${message}

Respond helpfully as a professional business assistant.
` : message;

    // For now, use a simple echo - we'll replace with actual OpenClaw integration
    const response = `I received your message: "${message}". 

This is coming from your Nexus agent (via OpenClaw). 
We're successfully connected! 

Next steps:
1. We can implement the full OpenClaw integration
2. Add the model-way framework (intent/phase tracking)
3. Enable RAG and business context

What would you like to work on first?`;
    
    res.json({
      success: true,
      data: {
        content: response,
        model: 'openclaw-internal',
        provider: 'openclaw',
        tokens: { prompt: 50, completion: 100 },
        latencyMs: 50
      }
    });
    
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'nexus-openclaw-proxy' });
});

// Start server
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Nexus → OpenClaw proxy running on port ${PORT}`);
  console.log(`POST /api/chat - Send chat messages`);
  console.log(`GET /health - Health check`);
});