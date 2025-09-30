/**
 * n8n Integration for Conversation Orchestration
 * This module integrates your current chat system with the n8n workflow
 */

const axios = require('axios');
const logger = require('./logger');

class N8nConversationOrchestrator {
  constructor(config = {}) {
    this.n8nUrl = config.n8nUrl || 'https://automate.marcoby.net';
    this.webhookPath = config.webhookPath || 'conversation-orchestrator';
    this.timeout = config.timeout || 30000;
    this.retries = config.retries || 2;
    this.apiKey = config.apiKey || process.env.N8N_API_KEY;
  }

  /**
   * Generate AI response using n8n workflow
   */
  async generateResponse(message, user, conversationHistory, context = {}) {
    try {
      const webhookUrl = `${this.n8nUrl}/webhook/${this.webhookPath}`;
      
      const payload = {
        message,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          companyId: user.companyId || user.organizationId
        },
        conversationHistory: conversationHistory || [],
        conversationId: context.conversationId,
        businessContext: context.businessHealth || {},
        dashboard: context.dashboard || {},
        nextBestActions: context.nextBestActions || [],
        timestamp: new Date().toISOString()
      };

      logger.info('Sending request to n8n workflow', {
        webhookUrl,
        userId: user.id,
        messageLength: message.length,
        conversationLength: conversationHistory?.length || 0
      });

      const response = await axios.post(webhookUrl, payload, {
        timeout: this.timeout,
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
        }
      });

      if (response.data && response.data.success) {
        logger.info('n8n workflow response received', {
          userId: user.id,
          intent: response.data.data.intent,
          purpose: response.data.data.purpose,
          ckbDocumentsFound: response.data.data.ckbInsights?.documentsFound || 0
        });

        return {
          success: true,
          data: {
            content: response.data.data.content,
            modelInfo: response.data.data.modelInfo,
            agentId: response.data.data.agentId,
            conversationId: response.data.data.conversationId,
            routing: {
              agent: response.data.data.agentId,
              confidence: 0.95,
              reasoning: `Routed to ${response.data.data.agentId} via n8n workflow`
            },
            domainCapabilities: {
              tools: ['conversation_orchestration', 'intent_analysis', 'ckb_integration', 'purpose_detection'],
              expertise: ['business_intelligence', 'conversation_management'],
              insights: ['intent_classification', 'purpose_establishment', 'context_awareness']
            },
            sources: response.data.data.ckbInsights?.documentsFound > 0 ? [{
              id: 'ckb-knowledge',
              title: response.data.data.ckbInsights.mostRelevant,
              contentType: 'knowledge_base',
              similarity: 0.85
            }] : [],
            ckbInsights: response.data.data.ckbInsights,
            conversationPurpose: response.data.data.conversationPurpose,
            nextSteps: response.data.data.nextSteps
          }
        };
      } else {
        throw new Error('Invalid response from n8n workflow');
      }

    } catch (error) {
      logger.error('n8n workflow error', {
        error: error.message,
        userId: user.id,
        webhookUrl: `${this.n8nUrl}/webhook/${this.webhookPath}`
      });

      // Fallback to current logic
      return {
        success: false,
        error: 'n8n workflow failed, falling back to current logic',
        fallback: true
      };
    }
  }

  /**
   * Test the n8n workflow connection
   */
  async testConnection() {
    try {
      const testPayload = {
        message: "Hello, this is a test message",
        user: {
          id: "test-user",
          email: "test@example.com",
          firstName: "Test",
          lastName: "User",
          companyId: "test-company"
        },
        conversationHistory: [],
        timestamp: new Date().toISOString()
      };

      const webhookUrl = `${this.n8nUrl}/webhook/${this.webhookPath}`;
      const response = await axios.post(webhookUrl, testPayload, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
        }
      });

      return {
        success: true,
        status: response.status,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        status: error.response?.status
      };
    }
  }

  /**
   * Get workflow status and health
   */
  async getWorkflowStatus() {
    try {
      const response = await axios.get(`${this.n8nUrl}/api/v1/workflows`, {
        timeout: 10000,
        headers: {
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
        }
      });

      const conversationWorkflow = response.data.data?.find(
        workflow => workflow.name === 'Conversation Orchestrator'
      );

      return {
        success: true,
        workflow: conversationWorkflow ? {
          id: conversationWorkflow.id,
          name: conversationWorkflow.name,
          active: conversationWorkflow.active,
          updatedAt: conversationWorkflow.updatedAt
        } : null
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

/**
 * Integration function to replace current generateAIResponse
 */
async function generateAIResponseWithN8n(message, systemPrompt, conversationHistory, agentId, businessHealth, user) {
  const orchestrator = new N8nConversationOrchestrator({
    n8nUrl: process.env.N8N_URL || 'https://automate.marcoby.net',
    webhookPath: 'conversation-orchestrator',
    timeout: 30000,
    apiKey: process.env.N8N_API_KEY
  });

  const context = {
    conversationId: conversationHistory.length > 0 ? conversationHistory[0].conversationId : null,
    businessHealth,
    dashboard: {},
    nextBestActions: []
  };

  const result = await orchestrator.generateResponse(message, user, conversationHistory, context);

  if (result.success) {
    return result.data.content;
  } else {
    // Fallback to current logic
    logger.warn('Falling back to current AI response logic', {
      userId: user.id,
      reason: result.error
    });
    
    // Import and use current generateAIResponse function
    const { generateAIResponse } = require('./ai_chat');
    return await generateAIResponse(message, systemPrompt, conversationHistory, agentId, businessHealth);
  }
}

module.exports = {
  N8nConversationOrchestrator,
  generateAIResponseWithN8n
};
