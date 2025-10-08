/**
 * Test Intake Agent
 * 
 * Simple test script to verify intake agent functionality
 */

const intake_agent = require('./src/edge-functions/intake_agent');

// Mock user for testing
const mockUser = {
  id: 'd2770389274aad9319e41dc713cb5c8206cc84f0cadf10e49c17dc329e66eec3',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User'
};

// Test cases
const testCases = [
  {
    name: 'Business Identity Request',
    input: 'I need help creating a business name and brand identity for my tech startup',
    expectedIntent: 'business_identity'
  },
  {
    name: 'Revenue Setup Request',
    input: 'How do I set up revenue tracking and pricing for my SaaS business?',
    expectedIntent: 'revenue_setup'
  },
  {
    name: 'Technical Problem',
    input: 'I have a critical issue with my website - it\'s broken and customers can\'t access it',
    expectedIntent: 'technical_support'
  },
  {
    name: 'General Question',
    input: 'What is the best way to start a business?',
    expectedIntent: 'question'
  },
  {
    name: 'Cash Flow Analysis',
    input: 'I need to analyze my cash flow and create a budget for next quarter',
    expectedIntent: 'cash_flow'
  }
];

async function testIntakeAgent() {
  console.log('🧠 Testing Intake Agent...\n');

  for (const testCase of testCases) {
    console.log(`📝 Test: ${testCase.name}`);
    console.log(`Input: "${testCase.input}"`);
    
    try {
      const result = await intake_agent({
        input: testCase.input,
        context: {},
        source: 'test'
      }, mockUser);

      if (result.success) {
        const analysis = result.data.analysis;
        const routing = result.data.routing;
        
        console.log(`✅ Success!`);
        console.log(`   Intent: ${analysis.intent} (expected: ${testCase.expectedIntent})`);
        console.log(`   Confidence: ${Math.round(analysis.confidence * 100)}%`);
        console.log(`   Priority: ${analysis.priority}`);
        console.log(`   Agent: ${routing.agent}`);
        console.log(`   Playbook: ${routing.playbook}`);
        console.log(`   Topics: ${analysis.topics.join(', ')}`);
        console.log(`   Brain Ticket Created: ${result.data.brainTicket ? 'Yes' : 'No'}`);
        
        // Check if intent matches expected
        if (analysis.intent === testCase.expectedIntent) {
          console.log(`   🎯 Intent Match: ✅`);
        } else {
          console.log(`   🎯 Intent Match: ❌ (got ${analysis.intent}, expected ${testCase.expectedIntent})`);
        }
      } else {
        console.log(`❌ Failed: ${result.error}`);
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
    
    console.log(''); // Empty line for readability
  }

  console.log('🏁 Intake Agent Test Complete!');
}

// Run the test
testIntakeAgent().catch(console.error);
