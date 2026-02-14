#!/usr/bin/env node

/**
 * OpenClaw → Nexus Integration Setup Script
 * 
 * This script helps configure OpenClaw to sync conversations with Nexus.
 * Run this from within OpenClaw or as a standalone setup tool.
 */

const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

class OpenClawNexusSetup {
  constructor() {
    this.config = {
      nexusApiUrl: 'https://napi.marcoby.net',
      apiKey: 'openclaw-default-key',
      userId: 'openclaw-system-user',
      syncEnabled: true,
      realtimeEnabled: false
    };
  }

  async runSetup() {
    console.log('🔧 OpenClaw → Nexus Integration Setup');
    console.log('======================================\n');
    
    console.log('This setup will help you configure OpenClaw to sync conversations with Nexus.\n');
    
    // 1. Get Nexus API URL
    this.config.nexusApiUrl = await question(
      `Nexus API URL [${this.config.nexusApiUrl}]: `
    ) || this.config.nexusApiUrl;
    
    // 2. Get API Key
    this.config.apiKey = await question(
      `OpenClaw API Key [${this.config.apiKey}]: `
    ) || this.config.apiKey;
    
    // 3. Get User ID
    this.config.userId = await question(
      `Nexus User ID for conversations [${this.config.userId}]: `
    ) || this.config.userId;
    
    // 4. Sync preferences
    const syncEnabled = await question(
      'Enable automatic conversation sync? (y/n) [y]: '
    );
    this.config.syncEnabled = !syncEnabled || syncEnabled.toLowerCase() === 'y';
    
    const realtimeEnabled = await question(
      'Enable real-time conversation streaming? (y/n) [n]: '
    );
    this.config.realtimeEnabled = realtimeEnabled.toLowerCase() === 'y';
    
    rl.close();
    
    // 5. Generate configuration
    await this.generateConfiguration();
    
    // 6. Test connection
    await this.testConnection();
    
    // 7. Show next steps
    this.showNextSteps();
  }

  async generateConfiguration() {
    console.log('\n📝 Generating configuration files...');
    
    // 1. Environment file for OpenClaw
    const envContent = `# OpenClaw ↔ Nexus Integration Configuration
NEXUS_API_URL=${this.config.nexusApiUrl}
OPENCLAW_API_KEY=${this.config.apiKey}
NEXUS_USER_ID=${this.config.userId}
NEXUS_SYNC_ENABLED=${this.config.syncEnabled}
NEXUS_REALTIME_ENABLED=${this.config.realtimeEnabled}`;
    
    await fs.writeFile('openclaw-nexus.env', envContent);
    console.log('✅ Created: openclaw-nexus.env');
    
    // 2. Sample sync module for OpenClaw
    const syncModuleContent = `/**
 * OpenClaw Nexus Sync Module
 * 
 * Integrate this module into OpenClaw to sync conversations with Nexus.
 */

const axios = require('axios');

class NexusSync {
  constructor(config = {}) {
    this.apiUrl = config.apiUrl || process.env.NEXUS_API_URL;
    this.apiKey = config.apiKey || process.env.OPENCLAW_API_KEY;
    this.userId = config.userId || process.env.NEXUS_USER_ID;
    this.enabled = config.enabled !== false;
    
    this.client = axios.create({
      baseURL: this.apiUrl,
      headers: {
        'Content-Type': 'application/json',
        'X-OpenClaw-Api-Key': this.apiKey
      }
    });
  }

  /**
   * Sync a conversation to Nexus
   */
  async syncConversation(conversation) {
    if (!this.enabled) {
      console.log('Nexus sync disabled, skipping...');
      return;
    }
    
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
        metadata: conversation.metadata || {}
      };
      
      const response = await this.client.post('/api/openclaw/conversations/sync', payload);
      
      console.log(\`✅ Conversation synced to Nexus: \${conversation.id}\`);
      return response.data;
      
    } catch (error) {
      console.error(\`❌ Failed to sync conversation to Nexus: \${error.message}\`);
      // Don't throw - allow OpenClaw to continue even if sync fails
    }
  }

  /**
   * Sync message in real-time (for streaming conversations)
   */
  async syncMessage(conversationId, message) {
    if (!this.enabled) {
      return;
    }
    
    // For real-time sync, you might want to use WebSocket or SSE
    // This is a simple HTTP implementation
    console.log(\`📤 Real-time message sync not implemented for message: \${message.id}\`);
    // Implement based on your needs
  }
}

// Export singleton instance
const nexusSync = new NexusSync({
  apiUrl: process.env.NEXUS_API_URL,
  apiKey: process.env.OPENCLAW_API_KEY,
  userId: process.env.NEXUS_USER_ID,
  enabled: process.env.NEXUS_SYNC_ENABLED === 'true'
});

module.exports = nexusSync;`;
    
    await fs.writeFile('nexus-sync.js', syncModuleContent);
    console.log('✅ Created: nexus-sync.js');
    
    // 3. Usage example
    const usageExample = `// How to use the Nexus sync module in OpenClaw:
// 
// 1. Load environment variables:
//    require('dotenv').config({ path: 'openclaw-nexus.env' });
//
// 2. Import the sync module:
//    const nexusSync = require('./nexus-sync');
//
// 3. Sync conversations when they happen:
//    // In your conversation handler:
//    async function handleConversation(conversation) {
//      // Your existing OpenClaw logic...
//      
//      // Sync to Nexus (non-blocking)
//      nexusSync.syncConversation(conversation).catch(console.error);
//      
//      // Return response as normal
//      return generateResponse(conversation);
//    }
//
// 4. For real-time streaming:
//    // If you want message-by-message sync:
//    async function handleMessage(conversationId, message) {
//      // Your existing logic...
//      
//      // Sync individual message
//      nexusSync.syncMessage(conversationId, message);
//    }

// Example integration points:
console.log(\`OpenClaw ↔ Nexus Integration Ready\`);
console.log(\`API URL: \${process.env.NEXUS_API_URL}\`);
console.log(\`User ID: \${process.env.NEXUS_USER_ID}\`);
console.log(\`Sync Enabled: \${process.env.NEXUS_SYNC_ENABLED}\`);`;
    
    await fs.writeFile('integration-example.js', usageExample);
    console.log('✅ Created: integration-example.js');
    
    // 4. Package.json updates (if needed)
    try {
      const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'));
      
      if (!packageJson.dependencies.axios) {
        packageJson.dependencies.axios = '^1.6.0';
        await fs.writeFile('package.json', JSON.stringify(packageJson, null, 2));
        console.log('✅ Updated: package.json (added axios dependency)');
      }
    } catch (error) {
      console.log('⚠️  Could not update package.json (file not found or parse error)');
    }
  }

  async testConnection() {
    console.log('\n🧪 Testing connection to Nexus...');
    
    try {
      const axios = require('axios');
      
      const response = await axios.get(\`\${this.config.nexusApiUrl}/api/openclaw/health\`, {
        headers: {
          'X-OpenClaw-Api-Key': this.config.apiKey
        }
      });
      
      console.log(\`✅ Connection successful!\`);
      console.log(\`   Status: \${response.data.status}\`);
      console.log(\`   Service: \${response.data.service}\`);
      
    } catch (error) {
      console.log(\`❌ Connection failed: \${error.message}\`);
      if (error.response) {
        console.log(\`   Status: \${error.response.status}\`);
        console.log(\`   Error: \${JSON.stringify(error.response.data)}\`);
      }
      console.log('\n⚠️  Please ensure:');
      console.log('   1. Nexus backend is running');
      console.log('   2. OpenClaw integration migrations are applied');
      console.log('   3. API key is correct in Nexus .env file');
    }
  }

  showNextSteps() {
    console.log('\n🚀 Next Steps:');
    console.log('===============\n');
    
    console.log('1. **Apply Nexus Migrations**');
    console.log('   Run migrations 112 and 113 on your Nexus database\n');
    
    console.log('2. **Configure Nexus Environment**');
    console.log('   Add to Nexus .env file:');
    console.log(`   OPENCLAW_API_KEY=${this.config.apiKey}\n`);
    
    console.log('3. **Integrate into OpenClaw**');
    console.log('   - Copy openclaw-nexus.env to your OpenClaw environment');
    console.log('   - Load it: require(\'dotenv\').config({ path: \'openclaw-nexus.env\' })');
    console.log('   - Import and use nexus-sync.js module\n');
    
    console.log('4. **Test the Integration**');
    console.log('   - Restart OpenClaw');
    console.log('   - Have a conversation');
    console.log('   - Check Nexus UI for the conversation\n');
    
    console.log('5. **Monitor Integration**');
    console.log('   - Check Nexus logs for sync events');
    console.log('   - Monitor database: SELECT * FROM openclaw_integration_health;\n');
    
    console.log('📚 Documentation:');
    console.log('   - Full guide: /server/docs/OPENCLAW_INTEGRATION.md');
    console.log('   - Deployment: /server/docs/OPENCLAW_DEPLOYMENT_CHECKLIST.md');
    
    console.log('\n🎉 Setup complete! Your OpenClaw conversations will now sync to Nexus.');
  }
}

// Run setup if called directly
if (require.main === module) {
  const setup = new OpenClawNexusSetup();
  setup.runSetup().catch(console.error);
} else {
  module.exports = OpenClawNexusSetup;
}