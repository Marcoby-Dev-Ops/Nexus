/**
 * Simple Chat System Test
 * 
 * Tests the chat system to ensure it's fully operational
 */

const axios = require('axios');

async function testChatSystem() {
  console.log('🧪 Testing Chat System...\n');

  const testCases = [
    {
      name: 'Basic Chat Test',
      message: 'Hello, can you help me with my business?',
      context: {
        user: {
          id: 'test-user-id',
          name: 'Test User',
          role: 'owner',
          department: 'Executive',
          experience_level: 'intermediate',
          communication_style: 'balanced'
        },
        company: {
          id: 'test-company-id',
          name: 'Test Company',
          industry: 'Technology',
          size: '10-50',
          description: 'A test company'
        },
        agent: {
          id: 'executive-assistant',
          type: 'assistant',
          capabilities: ['business_strategy', 'planning']
        },
        conversation: {
          id: null,
          history: []
        },
        attachments: []
      }
    },
    {
      name: 'Business Strategy Test',
      message: 'What are the key metrics I should track for my technology startup?',
      context: {
        user: {
          id: 'startup-founder',
          name: 'Startup Founder',
          role: 'owner',
          department: 'Executive',
          experience_level: 'beginner',
          communication_style: 'detailed'
        },
        company: {
          id: 'startup-company',
          name: 'TechStartup Inc',
          industry: 'Technology',
          size: '1-10',
          description: 'Early-stage technology startup'
        },
        agent: {
          id: 'executive-assistant',
          type: 'assistant',
          capabilities: ['business_strategy', 'metrics', 'startup_advice']
        },
        conversation: {
          id: null,
          history: []
        },
        attachments: []
      }
    },
    {
      name: 'Agent Switching Test',
      message: 'I need financial advice for my business',
      context: {
        user: {
          id: 'business-owner',
          name: 'Business Owner',
          role: 'owner',
          department: 'Executive',
          experience_level: 'intermediate',
          communication_style: 'balanced'
        },
        company: {
          id: 'business-id',
          name: 'My Business',
          industry: 'Services',
          size: '10-50',
          description: 'A growing service business'
        },
        agent: {
          id: 'finance-expert',
          type: 'specialist',
          capabilities: ['financial_analysis', 'budgeting', 'cash_flow']
        },
        conversation: {
          id: null,
          history: []
        },
        attachments: []
      }
    }
  ];

  for (const testCase of testCases) {
    console.log(`📝 Testing: ${testCase.name}`);
    console.log(`Message: "${testCase.message}"`);
    console.log(`Agent: ${testCase.context.agent.id}`);
    
    try {
      const response = await axios.post('http://localhost:3001/api/ai/chat', {
        message: testCase.message,
        context: testCase.context
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 second timeout
      });

      if (response.data.success) {
        console.log('✅ SUCCESS');
        console.log(`Response: ${response.data.data.content.substring(0, 100)}...`);
        console.log(`Agent ID: ${response.data.data.agentId}`);
        console.log(`Conversation ID: ${response.data.data.conversationId || 'None'}`);
      } else {
        console.log('❌ FAILED');
        console.log(`Error: ${response.data.error}`);
      }
    } catch (error) {
      console.log('❌ ERROR');
      if (error.response) {
        console.log(`Status: ${error.response.status}`);
        console.log(`Error: ${error.response.data.error || error.response.data}`);
      } else if (error.request) {
        console.log('Network Error: No response received');
      } else {
        console.log(`Error: ${error.message}`);
      }
    }
    
    console.log('---\n');
  }

  console.log('🎯 Chat System Test Complete!');
}

// Run the test
testChatSystem().catch(console.error);
