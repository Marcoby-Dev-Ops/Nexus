/**
 * DataAccessLayer Test
 * Simple test to verify the DataAccessLayer is working correctly
 */

import { dataAccess } from './DataAccessLayer';
import { supabase } from '@/core/supabase';

// Mock user ID for testing
const TEST_USER_ID = '5745f213-bac2-4bc4-b35a-15bd7fbdb27f';

/**
 * Test the DataAccessLayer functionality
 */
export async function testDataAccessLayer() {
  console.log('🧪 Testing DataAccessLayer...');

  try {
    // Test 1: Get user profile
    console.log('📋 Testing getUserProfile...');
    const profileResult = await dataAccess.getUserProfile(TEST_USER_ID);
    
    if (profileResult.error) {
      console.log('❌ Profile error:', profileResult.error);
    } else {
      console.log('✅ Profile loaded successfully');
      console.log('Profile data:', profileResult.data);
    }

    // Test 2: Get business data
    console.log('🏢 Testing getUserBusinessData...');
    const businessResult = await dataAccess.getUserBusinessData(TEST_USER_ID);
    
    if (businessResult.error) {
      console.log('❌ Business data error:', businessResult.error);
    } else {
      console.log('✅ Business data loaded successfully');
      console.log('Business data:', businessResult.data);
    }

    // Test 3: Get system status
    console.log('🔧 Testing getSystemStatus...');
    const systemResult = await dataAccess.getSystemStatus(TEST_USER_ID);
    
    if (systemResult.error) {
      console.log('❌ System status error:', systemResult.error);
    } else {
      console.log('✅ System status loaded successfully');
      console.log('System status:', systemResult.data);
    }

    console.log('🎉 DataAccessLayer tests completed!');

  } catch (error) {
    console.error('💥 Test failed:', error);
  }
}

/**
 * Test direct Supabase queries to verify table access
 */
export async function testDirectQueries() {
  console.log('🔍 Testing direct Supabase queries...');

  try {
    // Test user_profiles table
    console.log('📋 Testing user_profiles table...');
    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1);

    if (profileError) {
      console.log('❌ user_profiles error:', profileError);
    } else {
      console.log('✅ user_profiles accessible');
    }

    // Test business_profiles table
    console.log('🏢 Testing business_profiles table...');
    const { data: businessProfiles, error: businessError } = await supabase
      .from('business_profiles')
      .select('*')
      .limit(1);

    if (businessError) {
      console.log('❌ business_profiles error:', businessError);
    } else {
      console.log('✅ business_profiles accessible');
    }

    // Test companies table
    console.log('🏭 Testing companies table...');
    const { data: companies, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .limit(1);

    if (companyError) {
      console.log('❌ companies error:', companyError);
    } else {
      console.log('✅ companies accessible');
    }

    console.log('🎉 Direct query tests completed!');

  } catch (error) {
    console.error('💥 Direct query test failed:', error);
  }
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  (window as any).testDataAccessLayer = testDataAccessLayer;
  (window as any).testDirectQueries = testDirectQueries;
} 