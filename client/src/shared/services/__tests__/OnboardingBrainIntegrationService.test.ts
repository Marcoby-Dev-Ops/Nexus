/**
 * Test file for OnboardingBrainIntegrationService
 * 
 * Tests the integration of onboarding data with the brain system
 */

import { onboardingBrainIntegration } from '../OnboardingBrainIntegrationService';

// Mock user ID for testing (Von Jackson's user ID)
const TEST_USER_ID = 'd2770389274aad9319e41dc713cb5c8206cc84f0cadf10e49c17dc329e66eec3';

describe('OnboardingBrainIntegrationService', () => {
  describe('getOnboardingContext', () => {
    it('should fetch and transform onboarding data correctly', async () => {
      const response = await onboardingBrainIntegration.getOnboardingContext(TEST_USER_ID);
      
      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      
      if (response.data) {
        const { userProfile, businessContext, goals, tools, preferences } = response.data;
        
        // Test user profile
        expect(userProfile.personal.firstName).toBe('Von');
        expect(userProfile.personal.lastName).toBe('Jackson');
        expect(userProfile.personal.role).toBe('founder');
        expect(userProfile.personal.email).toBe('vonj@marcoby.com');
        
        // Test business context
        expect(businessContext.industry).toBe('technology');
        expect(businessContext.size).toBe('1-10');
        expect(businessContext.companyName).toBe('Marcoby');
        
        // Test that we have some goals and tools (even if empty arrays)
        expect(goals).toBeDefined();
        expect(tools).toBeDefined();
        expect(preferences).toBeDefined();
      }
    });

    it('should handle missing user gracefully', async () => {
      const response = await onboardingBrainIntegration.getOnboardingContext('non-existent-user');
      
      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
    });
  });

  describe('getPersonalizedSystemPrompt', () => {
    it('should generate personalized prompts for different agent types', async () => {
      const executivePrompt = await onboardingBrainIntegration.getPersonalizedSystemPrompt(TEST_USER_ID, 'executive');
      const salesPrompt = await onboardingBrainIntegration.getPersonalizedSystemPrompt(TEST_USER_ID, 'sales');
      const financePrompt = await onboardingBrainIntegration.getPersonalizedSystemPrompt(TEST_USER_ID, 'finance');
      
      expect(executivePrompt.success).toBe(true);
      expect(salesPrompt.success).toBe(true);
      expect(financePrompt.success).toBe(true);
      
      if (executivePrompt.success && salesPrompt.success && financePrompt.success) {
        // Should contain personalized context
        expect(executivePrompt.data).toContain('Von');
        expect(executivePrompt.data).toContain('Marcoby');
        expect(executivePrompt.data).toContain('technology');
        
        // Different agent types should have different base prompts
        expect(executivePrompt.data).toContain('executive-level');
        expect(salesPrompt.data).toContain('sales expert');
        expect(financePrompt.data).toContain('financial expert');
      }
    });
  });

  describe('enhanceChatContext', () => {
    it('should enhance chat context with onboarding data', async () => {
      const basePrompt = 'You are a helpful AI assistant.';
      const response = await onboardingBrainIntegration.enhanceChatContext(TEST_USER_ID, basePrompt);
      
      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      
      if (response.data) {
        const { systemPrompt, userContext, businessContext, goalsContext } = response.data;
        
        // Should contain the base prompt
        expect(systemPrompt).toContain(basePrompt);
        
        // Should contain personalized context
        expect(userContext).toContain('Von Jackson');
        expect(userContext).toContain('founder');
        expect(businessContext).toContain('Marcoby');
        expect(businessContext).toContain('technology');
        
        // Should have structured context sections
        expect(systemPrompt).toContain('IMPORTANT CONTEXT');
        expect(systemPrompt).toContain('User Profile:');
        expect(systemPrompt).toContain('Business Context:');
      }
    });
  });

  describe('caching', () => {
    it('should cache user profiles for performance', async () => {
      // First call should populate cache
      const response1 = await onboardingBrainIntegration.getOnboardingContext(TEST_USER_ID);
      expect(response1.success).toBe(true);
      
      // Second call should use cache
      const response2 = await onboardingBrainIntegration.getOnboardingContext(TEST_USER_ID);
      expect(response2.success).toBe(true);
      
      // Clear cache
      onboardingBrainIntegration.clearUserCache(TEST_USER_ID);
      
      // Third call should fetch from database again
      const response3 = await onboardingBrainIntegration.getOnboardingContext(TEST_USER_ID);
      expect(response3.success).toBe(true);
    });
  });
});
