// Test script to verify Foundation Journey is available
const { journeyService } = require('./src/services/playbook/JourneyService');

async function testFoundationJourney() {
  try {
    console.log('🧪 Testing Foundation Journey availability...');
    
    // Test 1: Get all journey templates
    console.log('\n1. Getting all journey templates...');
    const templatesResponse = await journeyService.getJourneyTemplates();
    
    if (templatesResponse.success) {
      const templates = templatesResponse.data;
      console.log(`✅ Found ${templates.length} journey templates`);
      
      const foundationJourney = templates.find(t => t.id === 'foundation-journey');
      if (foundationJourney) {
        console.log('✅ Foundation Journey template found!');
        console.log(`   Title: ${foundationJourney.title}`);
        console.log(`   Description: ${foundationJourney.description}`);
        console.log(`   Duration: ${foundationJourney.estimated_duration_minutes} minutes`);
      } else {
        console.log('❌ Foundation Journey template not found');
      }
    } else {
      console.log('❌ Failed to get journey templates:', templatesResponse.error);
    }
    
    // Test 2: Get Foundation Journey items
    console.log('\n2. Getting Foundation Journey items...');
    const itemsResponse = await journeyService.getJourneyItems('foundation-journey');
    
    if (itemsResponse.success) {
      const items = itemsResponse.data;
      console.log(`✅ Found ${items.length} journey items`);
      
      items.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.title} (${item.step_type})`);
      });
    } else {
      console.log('❌ Failed to get journey items:', itemsResponse.error);
    }
    
    // Test 3: Test onboarding status check
    console.log('\n3. Testing onboarding status check...');
    const testUserId = 'test-user-id';
    const statusResponse = await journeyService.checkOnboardingStatus(testUserId);
    
    console.log('✅ Onboarding status check completed');
    console.log(`   Needs onboarding: ${statusResponse.needsOnboarding}`);
    console.log(`   Has active journey: ${statusResponse.hasActiveJourney}`);
    
    console.log('\n🎉 Foundation Journey test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testFoundationJourney();
