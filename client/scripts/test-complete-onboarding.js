#!/usr/bin/env node

/**
 * Test script for complete-onboarding edge function
 * This script helps verify the function is working correctly
 */

const { createClient } = require('@supabase/supabase-js');

// Test the complete-onboarding Edge Function
async function testCompleteOnboarding() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing environment variables');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Get a test user session
  const { data: { session }, error: authError } = await supabase.auth.getSession();
  
  if (authError || !session) {
    console.error('No authenticated session found');
    return;
  }

  console.log('Testing complete-onboarding Edge Function...');

  try {
    const { data, error } = await supabase.functions.invoke('complete-onboarding', {
      body: {
        userId: session.user.id,
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
      }
    });

    if (error) {
      console.error('Edge Function error:', error);
    } else {
      console.log('Edge Function response:', data);
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testCompleteOnboarding(); 