#!/usr/bin/env node

/**
 * Test script for complete-onboarding edge function
 * This script helps verify the function is working correctly
 */

const fetch = require('node-fetch');

// Test the complete-onboarding Edge Function
async function testCompleteOnboarding() {
  const apiUrl = process.env.VITE_API_URL || 'http://localhost:3001';
  
  if (!apiUrl) {
    console.error('Missing VITE_API_URL environment variable');
    return;
  }

  console.log('Testing complete-onboarding Edge Function...');

  try {
    const response = await fetch(`${apiUrl}/api/edge/complete-onboarding`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: This would need proper authentication in a real scenario
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify({
        userId: 'test-user-id',
        firstName: 'Test',
        lastName: 'User',
        displayName: 'Test User',
        jobTitle: 'Developer',
        company: 'Test Company',
        industry: 'Technology',
        companySize: '1-10',
        primaryGoals: ['Automation', 'Analytics'],
        businessChallenges: ['Manual processes'],
        selectedIntegrations: ['hubspot'],
        selectedUseCases: ['data-analysis'],
        completedAt: new Date().toISOString()
      })
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Edge Function error:', result);
    } else {
      console.log('Edge Function response:', result);
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testCompleteOnboarding(); 