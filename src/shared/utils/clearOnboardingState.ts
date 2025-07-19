/**
 * Utility to clear onboarding state
 * Use this to reset onboarding if it's causing issues
 */

export const clearOnboardingState = () => {
  try {
    // Clear onboarding completion flag
    localStorage.removeItem('nexus_onboarding_complete');
    
    // Clear any other onboarding-related storage
    const keysToRemove = [
      'nexus_onboarding_complete',
      'nexus_onboarding_step',
      'nexus_onboarding_state',
      'nexus_user_onboarding'
    ];
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
    
    console.log('Onboarding state cleared successfully');
    return true;
  } catch (error) {
    console.error('Failed to clear onboarding state:', error);
    return false;
  }
};

/**
 * Clear onboarding state and refresh the page
 * Use this when users encounter onboarding issues
 */
export const clearOnboardingStateAndRefresh = () => {
  clearOnboardingState();
  window.location.reload();
};

/**
 * Check if onboarding is currently active
 */
export const isOnboardingActive = (): boolean => {
  try {
    const completed = localStorage.getItem('nexus_onboarding_complete');
    return completed !== 'true';
  } catch {
    return false;
  }
};

/**
 * Force complete onboarding
 */
export const forceCompleteOnboarding = () => {
  try {
    localStorage.setItem('nexus_onboarding_complete', 'true');
    console.log('Onboarding forced to complete');
    return true;
  } catch (error) {
    console.error('Failed to force complete onboarding:', error);
    return false;
  }
}; 