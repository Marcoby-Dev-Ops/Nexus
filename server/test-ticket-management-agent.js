/**
 * Test Ticket Management Agent
 * 
 * Simple test script to verify ticket management agent functionality
 */

const ticket_management_agent = require('./src/edge-functions/ticket_management_agent');

// Mock user for testing
const mockUser = {
  id: 'd2770389274aad9319e41dc713cb5c8206cc84f0cadf10e49c17dc329e66eec3',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User'
};

// Mock ticket data for testing
const mockTicketData = {
  title: 'Test Business Identity Setup',
  description: 'Need help creating a business name and brand identity for my tech startup',
  ticket_type: 'business_identity',
  priority: 'high',
  category: 'business',
  source: 'intake_agent',
  tags: ['business_identity', 'branding', 'startup'],
  ai_insights: {
    intent: 'business_identity',
    confidence: 0.85,
    routing: {
      agent: 'business-identity-consultant',
      playbook: 'identity_setup',
      reasoning: 'User needs business identity setup'
    }
  }
};

// Test cases
const testCases = [
  {
    name: 'Validate Ticket Structure',
    action: 'validate_ticket',
    payload: {
      updateData: mockTicketData
    },
    expectedSuccess: true
  },
  {
    name: 'Monitor Ticket Health',
    action: 'monitor_health',
    payload: {},
    expectedSuccess: true
  },
  {
    name: 'Analyze Health with Invalid Ticket ID',
    action: 'analyze_health',
    payload: {
      ticketId: 'invalid-ticket-id'
    },
    expectedSuccess: false
  }
];

async function testTicketManagementAgent() {
  console.log('🧠 Testing Ticket Management Agent...\n');

  for (const testCase of testCases) {
    console.log(`📝 Test: ${testCase.name}`);
    console.log(`Action: ${testCase.action}`);
    
    try {
      const result = await ticket_management_agent({
        action: testCase.action,
        ...testCase.payload
      }, mockUser);

      if (result.success === testCase.expectedSuccess) {
        console.log(`✅ Success! Expected: ${testCase.expectedSuccess}, Got: ${result.success}`);
        
        if (result.success) {
          if (testCase.action === 'validate_ticket') {
            const validation = result.data.validation;
            console.log(`   Valid: ${validation.isValid}`);
            console.log(`   Errors: ${validation.errors.length}`);
            console.log(`   Warnings: ${validation.warnings.length}`);
            console.log(`   Missing Elements: ${validation.missingElements.length}`);
          } else if (testCase.action === 'monitor_health') {
            const health = result.data;
            console.log(`   Total Tickets: ${health.totalTickets}`);
            console.log(`   Active Tickets: ${health.activeTickets}`);
            console.log(`   Completed Tickets: ${health.completedTickets}`);
            console.log(`   Overall Health Score: ${health.overallHealthScore || 'N/A'}`);
            console.log(`   AI Generated: ${health.aiGenerated || false}`);
          }
        } else {
          console.log(`   Error: ${result.error}`);
        }
      } else {
        console.log(`❌ Failed! Expected: ${testCase.expectedSuccess}, Got: ${result.success}`);
        if (!result.success) {
          console.log(`   Error: ${result.error}`);
        }
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
    
    console.log(''); // Empty line for readability
  }

  console.log('🏁 Ticket Management Agent Test Complete!');
}

// Run the test
testTicketManagementAgent().catch(console.error);
