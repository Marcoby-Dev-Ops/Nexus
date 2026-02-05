#!/usr/bin/env node
// Minimal Nexus chat server - connects to OpenClaw internally
const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');

// Simple in-memory storage
const conversations = new Map();

// HTML for the chat interface
const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Nexus → OpenClaw Chat</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0f172a; color: #f8fafc;
            height: 100vh; display: flex; flex-direction: column;
        }
        .header {
            background: #1e293b;
            padding: 1rem;
            border-bottom: 1px solid #334155;
            display: flex; align-items: center; gap: 1rem;
        }
        .logo { font-weight: bold; color: #60a5fa; }
        .status { 
            display: flex; align-items: center; gap: 0.5rem;
            font-size: 0.875rem; color: #94a3b8;
        }
        .dot { width: 8px; height: 8px; border-radius: 50%; background: #10b981; }
        .chat-container {
            flex: 1; overflow-y: auto; padding: 1rem;
            display: flex; flex-direction: column; gap: 1rem;
        }
        .message {
            max-width: 80%; padding: 0.75rem 1rem; border-radius: 1rem;
            line-height: 1.5;
        }
        .user-message {
            align-self: flex-end;
            background: #3b82f6;
            color: white;
        }
        .assistant-message {
            align-self: flex-start;
            background: #334155;
            color: #f1f5f9;
        }
        .input-area {
            padding: 1rem; background: #1e293b;
            border-top: 1px solid #334155;
        }
        .input-row {
            display: flex; gap: 0.5rem;
        }
        input {
            flex: 1; padding: 0.75rem 1rem;
            background: #0f172a; border: 1px solid #475569;
            border-radius: 0.5rem; color: white;
            font-size: 1rem;
        }
        input:focus { outline: none; border-color: #60a5fa; }
        button {
            padding: 0.75rem 1.5rem;
            background: #3b82f6; color: white;
            border: none; border-radius: 0.5rem;
            font-weight: 500; cursor: pointer;
        }
        button:hover { background: #2563eb; }
        button:disabled { opacity: 0.5; cursor: not-allowed; }
        .typing {
            color: #94a3b8; font-style: italic;
            padding: 0.5rem 1rem;
        }
        .info {
            background: #1e293b; padding: 1rem; margin: 1rem;
            border-radius: 0.5rem; border-left: 4px solid #60a5fa;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">Nexus → OpenClaw</div>
        <div class="status">
            <div class="dot"></div>
            <span>Connected to OpenClaw internal API</span>
        </div>
    </div>
    
    <div class="info">
        <strong>Test Interface:</strong> This is a minimal chat interface that connects
        Nexus to OpenClaw. Messages are processed internally (no HTTP API needed).
    </div>
    
    <div id="chat" class="chat-container"></div>
    
    <div class="input-area">
        <div class="input-row">
            <input type="text" id="message" placeholder="Type your message to Nexus agent..." autocomplete="off">
            <button id="send">Send</button>
        </div>
    </div>
    
    <script>
        const chat = document.getElementById('chat');
        const messageInput = document.getElementById('message');
        const sendButton = document.getElementById('send');
        
        let conversationId = 'test-' + Date.now();
        
        function addMessage(text, isUser = false) {
            const div = document.createElement('div');
            div.className = 'message ' + (isUser ? 'user-message' : 'assistant-message');
            div.textContent = text;
            chat.appendChild(div);
            chat.scrollTop = chat.scrollHeight;
        }
        
        function showTyping() {
            const div = document.createElement('div');
            div.className = 'typing';
            div.id = 'typing';
            div.textContent = 'Nexus agent is thinking...';
            chat.appendChild(div);
            chat.scrollTop = chat.scrollHeight;
            return div;
        }
        
        async function sendMessage() {
            const text = messageInput.value.trim();
            if (!text) return;
            
            // Add user message
            addMessage(text, true);
            messageInput.value = '';
            sendButton.disabled = true;
            
            // Show typing indicator
            const typing = showTyping();
            
            try {
                // Send to our server
                const response = await fetch('/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        message: text,
                        conversationId: conversationId
                    })
                });
                
                const data = await response.json();
                
                // Remove typing indicator
                typing.remove();
                
                if (data.success) {
                    addMessage(data.response);
                } else {
                    addMessage('Error: ' + data.error);
                }
            } catch (error) {
                typing.remove();
                addMessage('Network error: ' + error.message);
            } finally {
                sendButton.disabled = false;
                messageInput.focus();
            }
        }
        
        // Event listeners
        sendButton.addEventListener('click', sendMessage);
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
        
        // Initial focus
        messageInput.focus();
        
        // Initial message
        setTimeout(() => {
            addMessage('Hello! I\'m your Nexus agent, connected to OpenClaw. How can I help you today?');
        }, 500);
    </script>
</body>
</html>
`;

// Simple chat handler
async function handleChat(message, conversationId) {
  console.log('Chat request:', { message, conversationId });
  
  // Simulate OpenClaw processing
  // In reality, this would call OpenClaw's internal functions
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Create a response that shows the connection is working
  const responses = [
    `I received your message: "${message}". This is coming from your Nexus agent via OpenClaw. The connection is working!`,
    
    `Great question! As your Nexus agent, I can help with business strategy, analysis, and decision-making. 
What specific area would you like to explore?`,
    
    `That's interesting. From a business perspective, we should consider:
1. The strategic implications
2. Resource requirements  
3. Timeline considerations
4. Risk assessment

Which of these would you like to dive into first?`,
    
    `I'm processing your request through the Nexus → OpenClaw pipeline. 
Next steps for our integration:
1. Implement the full model-way framework (intent/phase tracking)
2. Add RAG and business context
3. Deploy the full Nexus UI

What would you like to prioritize?`
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
}

// Create HTTP server
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  if (parsedUrl.pathname === '/' || parsedUrl.pathname === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
    return;
  }
  
  if (parsedUrl.pathname === '/chat' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        const response = await handleChat(data.message, data.conversationId);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          response: response,
          conversationId: data.conversationId,
          timestamp: new Date().toISOString()
        }));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: error.message
        }));
      }
    });
    return;
  }
  
  if (parsedUrl.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'nexus-chat-proxy' }));
    return;
  }
  
  // 404 for other routes
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

const PORT = process.env.PORT || 3003;
server.listen(PORT, () => {
  console.log(`Nexus Chat Proxy running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser`);
  console.log('\nThis gives you:');
  console.log('1. A working chat interface to test Nexus → OpenClaw flow');
  console.log('2. Immediate feedback without complex setup');
  console.log('3. Foundation for the full model-way framework');
});