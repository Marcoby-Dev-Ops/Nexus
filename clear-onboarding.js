// Simple script to clear onboarding localStorage and reset state
// Run this in the browser console to get unstuck from onboarding loops

console.log('Clearing onboarding localStorage data...');

// Clear all onboarding-related localStorage items
const keysToClear = [
  'nexus_onboarding_form_data',
  'nexus_onboarding_phase_data', 
  'nexus_onboarding_step_data',
  'nexus_onboarding_progress',
  'nexus_onboarding_last_saved'
];

keysToClear.forEach(key => {
  localStorage.removeItem(key);
  console.log(`Cleared: ${key}`);
});

// Also clear sessionStorage
sessionStorage.removeItem('onboarding_mismatch_logged');

console.log('Onboarding localStorage cleared! Refresh the page to restart onboarding.');
