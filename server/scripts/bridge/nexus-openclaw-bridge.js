const express = require('express');
const { exec } = require('child_process');
const app = express();

// Basic body parser if available, or just standard express.json() (express 4.16+)
app.use(express.json());

const PORT = 3002;
const OPENCLAW_BIN = 'openclaw'; // Assumes in PATH
const SESSION_ID = 'nexus-chat';

console.log(`🦞 Nexus -> OpenClaw Bridge starting on port ${PORT}...`);

app.post('/v1/chat/completions', async (req, res) => {
  try {
    const { messages, model } = req.body;
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: { message: 'Invalid messages array' } });
    }

    // Get the last user message
    // OpenClaw CLI is turn-based, so we just send the latest input.
    // The agent maintains history in the session.
    // However, if the user sends a system prompt or history, OpenClaw CLI ignores it 
    // for the *current* turn input, but the session history preserves it.
    // We'll just extract the last message content.
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role !== 'user') {
        // If the last message isn't user, maybe we are just seeding history?
        // But for chat completion, usually the last one is user.
        console.log('Last message is not user:', lastMessage);
    }
    const userContent = lastMessage.content;

    console.log(`[Bridge] Sending to OpenClaw: "${userContent.substring(0, 50)}..."`);

    // Use the user ID from the request as the session ID, or fall back to default
    // OpenClaw CLI uses --session-id to isolate context.
    const sessionId = req.body.user || 'nexus-default';
    const sanitizedSessionId = sessionId.replace(/[^a-zA-Z0-9_-]/g, '_'); // Safety first

    // Call OpenClaw CLI
    // We use --json to get structured output
    const cmd = `${OPENCLAW_BIN} agent --session-id "nexus-${sanitizedSessionId}" --message "${userContent.replace(/"/g, '\\"')}" --json`;
    
    exec(cmd, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
      if (error) {
        console.error('[Bridge] OpenClaw CLI error:', error);
        console.error('[Bridge] stderr:', stderr);
        return res.status(500).json({ 
            error: { 
                message: 'OpenClaw CLI failed', 
                details: stderr || error.message 
            } 
        });
      }

      try {
        // stdout is the JSON output from OpenClaw
        const result = JSON.parse(stdout);
        
        let assistantMessage = "No response text found.";
        
        if (result.result && result.result.payloads && result.result.payloads.length > 0) {
             // Find the first text payload
             const textPayload = result.result.payloads.find(p => p.text);
             if (textPayload) {
                 assistantMessage = textPayload.text;
             }
        } else if (result.message) {
             assistantMessage = result.message;
        }

        const response = {
          id: 'chatcmpl-' + Date.now(),
          object: 'chat.completion',
          created: Math.floor(Date.now() / 1000),
          model: model || 'openclaw-agent',
          choices: [
            {
              index: 0,
              message: {
                role: 'assistant',
                content: assistantMessage
              },
              finish_reason: 'stop'
            }
          ],
          usage: {
            prompt_tokens: 0,
            completion_tokens: 0,
            total_tokens: 0
          }
        };

        console.log(`[Bridge] Reply received (${assistantMessage.length} chars)`);
        res.json(response);

      } catch (parseError) {
        console.error('[Bridge] JSON parse error:', parseError);
        console.log('[Bridge] Raw stdout:', stdout);
        return res.status(500).json({ error: { message: 'Failed to parse OpenClaw response' } });
      }
    });

  } catch (error) {
    console.error('[Bridge] Handler error:', error);
    res.status(500).json({ error: { message: 'Internal bridge error' } });
  }
});

app.listen(PORT, () => {
  console.log(`[Bridge] Listening on http://localhost:${PORT}/v1/chat/completions`);
});
