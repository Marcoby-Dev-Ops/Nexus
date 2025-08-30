// Test script to check onboarding data retrieval
import { selectData } from './src/lib/api-client.js';

async function testOnboardingCheck() {
  const userId = 'd2770389274aad9319e41dc713cb5c8206cc84f0cadf10e49c17dc329e66eec3';
  
  console.log('Testing onboarding data retrieval...');
  
  try {
    // Test 1: Check user profile
    console.log('1. Checking user profile...');
    const { data: userProfile, error: profileError } = await selectData(
      'user_profiles',
      'onboarding_completed, onboarding_completed_at',
      { user_id: userId }
    );
    
    console.log('User profile result:', { userProfile, profileError });
    
    // Test 2: Check onboarding steps
    console.log('2. Checking onboarding steps...');
    const { data: steps, error: stepsError } = await selectData(
      'user_onboarding_steps',
      'step_id',
      { user_id: userId }
    );
    
    console.log('Onboarding steps result:', { steps, stepsError });
    
    // Test 3: Check if we have key steps
    if (steps && !stepsError) {
      const completedStepIds = steps.map(step => step.step_id);
      const keySteps = ['welcome-introduction', 'basic-profile-creation', 'ai-goal-generation', 'fire-concepts', 'launch'];
      const hasKeySteps = keySteps.every(stepId => completedStepIds.includes(stepId));
      
      console.log('3. Key steps check:', {
        completedStepIds,
        keySteps,
        hasKeySteps,
        missingSteps: keySteps.filter(stepId => !completedStepIds.includes(stepId))
      });
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testOnboardingCheck();
