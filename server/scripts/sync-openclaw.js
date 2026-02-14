#!/usr/bin/env node

/**
 * OpenClaw to Nexus Conversation Sync Script
 * 
 * This script syncs OpenClaw conversations to the Nexus backend.
 * It can be run as a standalone script or integrated into OpenClaw.
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

class NexusSyncClient {
  constructor(config = {}) {
    this.apiUrl = config.apiUrl || process.env.NEXUS_API_URL || 'https://napi.marcoby.net';
    this.apiKey = config.apiKey || process.env.OPENCLAW_API_KEY || 'openclaw-default-key';
    this.userId = config.userId || process.env.NEXUS_USER_ID || 'openclaw-system-user';
    
    this.client = axios.create({
      baseURL: this.apiUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'X-OpenClaw-Api-Key': this.apiKey
      }
    });
  }

  /**
   * Sync a single conversation to Nexus
   * @param {Object} conversation - OpenClaw conversation object
   * @param {String} conversation.id - Conversation ID
   * @param {String} conversation.title - Conversation title
   * @param {Array} conversation.messages - Array of messages
   * @param {Object} conversation.metadata - Additional metadata
   * @returns {Promise<Object>} - Sync result
   */
  async syncConversation(conversation) {
    try {
      const payload = {
        userId: this.userId,
        conversationId: conversation.id,
        title: conversation.title || 'OpenClaw Conversation',
        messages: conversation.messages.map(msg => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          created_at: msg.created_at || new Date().toISOString()
        })),
        model: conversation.model || 'openclaw',
        systemPrompt: conversation.systemPrompt,
        metadata: conversation.metadata || {}
      };

      const response = await this.client.post('/api/openclaw/conversations/sync', payload);
      
      console.log(`✅ Conversation synced: ${conversation.id} -> ${response.data.data.conversationId}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Failed to sync conversation ${conversation.id}:`, error.message);
      if (error.response) {
        console.error('Response:', error.response.data);
      }
      throw error;
    }
  }

  /**
   * Sync multiple conversations
   * @param {Array} conversations - Array of conversation objects
   * @returns {Promise<Array>} - Results for each conversation
   */
  async syncConversations(conversations) {
    const results = [];
    
    for (const conversation of conversations) {
      try {
        const result = await this.syncConversation(conversation);
        results.push({ success: true, conversationId: conversation.id, result });
      } catch (error) {
        results.push({ success: false, conversationId: conversation.id, error: error.message });
      }
    }
    
    return results;
  }

  /**
   * Get OpenClaw conversations from Nexus
   * @returns {Promise<Array>} - List of conversations
   */
  async getConversations() {
    try {
      const response = await this.client.get('/api/openclaw/conversations', {
        params: { userId: this.userId }
      });
      
      return response.data.data.conversations;
    } catch (error) {
      console.error('Failed to fetch conversations:', error.message);
      throw error;
    }
  }

  /**
   * Stream real-time conversation updates
   * @param {Function} onMessage - Callback for new messages
   */
  async streamConversations(onMessage) {
    try {
      const response = await this.client.get('/api/openclaw/conversations/stream', {
        params: { userId: this.userId },
        responseType: 'stream'
      });

      let buffer = '';
      
      response.data.on('data', (chunk) => {
        buffer += chunk.toString();
        
        // Parse SSE events
        const lines = buffer.split('\n');
        buffer = lines.pop(); // Keep incomplete line in buffer
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.substring(6));
              onMessage(data);
            } catch (e) {
              // Not JSON data, might be a keepalive
            }
          }
        }
      });

      response.data.on('end', () => {
        console.log('Stream ended');
      });

      response.data.on('error', (error) => {
        console.error('Stream error:', error);
      });

    } catch (error) {
      console.error('Failed to establish stream:', error.message);
    }
  }

  /**
   * Test connection to Nexus
   * @returns {Promise<boolean>} - Connection status
   */
  async testConnection() {
    try {
      const response = await this.client.get('/api/openclaw/health');
      console.log('✅ Connection test successful:', response.data);
      return true;
    } catch (error) {
      console.error('❌ Connection test failed:', error.message);
      return false;
    }
  }
}

// Command line interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  const client = new NexusSyncClient();
  
  switch (command) {
    case 'test':
      await client.testConnection();
      break;
      
    case 'sync':
      if (args.length < 2) {
        console.error('Usage: node sync-openclaw.js sync <conversation-file.json>');
        process.exit(1);
      }
      
      const filePath = args[1];
      try {
        const data = await fs.readFile(filePath, 'utf8');
        const conversations = JSON.parse(data);
        
        if (!Array.isArray(conversations)) {
          console.error('Conversation file must contain an array of conversations');
          process.exit(1);
        }
        
        console.log(`Syncing ${conversations.length} conversations...`);
        const results = await client.syncConversations(conversations);
        
        const successCount = results.filter(r => r.success).length;
        console.log(`\n✅ ${successCount}/${conversations.length} conversations synced successfully`);
        
        // Save results
        const outputPath = filePath.replace('.json', '-results.json');
        await fs.writeFile(outputPath, JSON.stringify(results, null, 2));
        console.log(`Results saved to: ${outputPath}`);
        
      } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
      }
      break;
      
    case 'list':
      try {
        const conversations = await client.getConversations();
        console.log(`Found ${conversations.length} conversations:`);
        conversations.forEach(conv => {
          console.log(`- ${conv.title} (${conv.message_count} messages, ${new Date(conv.created_at).toLocaleString()})`);
        });
      } catch (error) {
        console.error('Error:', error.message);
      }
      break;
      
    case 'stream':
      console.log('Starting conversation stream...');
      await client.streamConversations((data) => {
        console.log('New message:', data);
      });
      break;
      
    default:
      console.log(`
OpenClaw to Nexus Sync Tool
============================
Usage: node sync-openclaw.js <command> [args]

Commands:
  test              - Test connection to Nexus
  sync <file.json>  - Sync conversations from JSON file
  list              - List existing conversations
  stream            - Stream real-time conversation updates
  
Environment Variables:
  NEXUS_API_URL     - Nexus API URL (default: https://napi.marcoby.net)
  OPENCLAW_API_KEY  - API key for OpenClaw integration
  NEXUS_USER_ID     - User ID for conversation ownership
      `);
      break;
  }
}

// Export for use as module
if (require.main === module) {
  main().catch(console.error);
} else {
  module.exports = NexusSyncClient;
}