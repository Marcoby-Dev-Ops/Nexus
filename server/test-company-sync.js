#!/usr/bin/env node

/**
 * Test Script: Company Sync During Signup
 * 
 * This script tests the new company sync functionality in /api/auth/update-business-info
 * to ensure companies are created with the correct business name when users submit
 * their business information during signup.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { query } = require('./src/database/connection');
const { logger } = require('./src/utils/logger');

const TEST_DATA = {
  businessName: 'Test Company XYZ',
  businessType: 'startup',
  industry: 'technology',
  companySize: '1-10',
  firstName: 'Test',
  lastName: 'User',
  email: 'test-company-sync@example.com',
  phone: '+1 (555) 999-8888',
  fundingStage: 'bootstrap',
  revenueRange: '0-100k'
};

async function cleanupTestData() {
  console.log('🧹 Cleaning up any existing test data...');
  
  // Get user_id from email
  const userResult = await query(
    'SELECT id, user_id, company_id FROM user_profiles WHERE email = $1',
    [TEST_DATA.email]
  );
  
  if (userResult.data && userResult.data.length > 0) {
    const profile = userResult.data[0];
    
    // Delete user profile
    await query('DELETE FROM user_profiles WHERE id = $1', [profile.id]);
    
    // Delete company if it was created
    if (profile.company_id) {
      await query('DELETE FROM companies WHERE id = $1', [profile.company_id]);
    }
    
    console.log('✅ Cleaned up existing test data');
  } else {
    console.log('ℹ️  No existing test data found');
  }
}

async function testCompanySyncFlow() {
  console.log('\n🧪 Testing Company Sync During Signup Flow\n');
  
  try {
    // Step 1: Clean up any existing test data
    await cleanupTestData();
    
    // Step 2: Simulate what happens when the endpoint is called
    console.log('📝 Step 1: Simulating /api/auth/update-business-info endpoint call');
    console.log('   Business Name:', TEST_DATA.businessName);
    console.log('   Email:', TEST_DATA.email);
    
    // Import services
    const userProfileService = require('./src/services/UserProfileService');
    const companyService = require('./src/services/CompanyService');
    
    // Create a mock user ID (in real flow, this comes from Authentik)
    const mockUserId = 'test_user_' + Date.now();
    
    // Step 3: Call company sync logic (this is what the endpoint now does)
    console.log('\n📝 Step 2: Creating company with business data');
    const companyData = {
      businessName: TEST_DATA.businessName,
      companyName: TEST_DATA.businessName,
      industry: TEST_DATA.industry || 'Technology',
      companySize: TEST_DATA.companySize || '1-10',
      businessType: TEST_DATA.businessType || null,
      fundingStage: TEST_DATA.fundingStage || null,
      revenueRange: TEST_DATA.revenueRange || null,
    };
    
    const companyResult = await companyService.ensureCompanyForUser(
      mockUserId,
      companyData,
      null
    );
    
    if (!companyResult.success) {
      console.error('❌ Company creation failed:', companyResult.error);
      process.exit(1);
    }
    
    console.log('✅ Company created successfully');
    console.log('   Company ID:', companyResult.company.id);
    console.log('   Company Name:', companyResult.company.name);
    
    // Step 4: Ensure user profile is created and linked to company
    console.log('\n📝 Step 3: Creating user profile and linking to company');
    const profileResult = await userProfileService.ensureUserProfile(
      mockUserId,
      TEST_DATA.email,
      {
        company_id: companyResult.company.id,
        company_name: TEST_DATA.businessName,
        first_name: TEST_DATA.firstName,
        last_name: TEST_DATA.lastName,
        phone: TEST_DATA.phone || null,
        signup_completed: true,
        business_profile_completed: true,
        onboarding_completed: true
      },
      {
        email: TEST_DATA.email,
        name: `${TEST_DATA.firstName} ${TEST_DATA.lastName}`,
        attributes: {
          first_name: TEST_DATA.firstName,
          last_name: TEST_DATA.lastName,
          business_name: TEST_DATA.businessName,
          industry: TEST_DATA.industry,
          company_size: TEST_DATA.companySize
        }
      }
    );
    
    if (!profileResult.success) {
      console.error('❌ User profile creation failed:', profileResult.error);
      process.exit(1);
    }
    
    console.log('✅ User profile created successfully');
    console.log('   Profile ID:', profileResult.data.id);
    console.log('   User ID:', profileResult.data.user_id);
    
    // Step 5: Verify data in database
    console.log('\n📝 Step 4: Verifying data in database');
    const verifyResult = await query(`
      SELECT 
        up.id AS profile_id,
        up.user_id,
        up.email,
        up.first_name,
        up.last_name,
        up.company_id,
        up.company_name AS profile_company_name,
        c.id AS company_id,
        c.name AS company_name,
        c.industry,
        c.size
      FROM user_profiles up
      LEFT JOIN companies c ON up.company_id = c.id
      WHERE up.user_id = $1
    `, [mockUserId]);
    
    if (verifyResult.error || !verifyResult.data || verifyResult.data.length === 0) {
      console.error('❌ Verification failed - no data found');
      process.exit(1);
    }
    
    const result = verifyResult.data[0];
    
    console.log('\n✅ Verification Results:');
    console.table([{
      'User ID': result.user_id,
      'Email': result.email,
      'Name': `${result.first_name} ${result.last_name}`,
      'Profile Company Name': result.profile_company_name,
      'Company ID': result.company_id,
      'Company Name': result.company_name,
      'Industry': result.industry,
      'Size': result.size
    }]);
    
    // Step 6: Validate results
    console.log('\n📝 Step 5: Validating results');
    const validations = [
      {
        name: 'Company name matches business name',
        expected: TEST_DATA.businessName,
        actual: result.company_name,
        pass: result.company_name === TEST_DATA.businessName
      },
      {
        name: 'Profile linked to company',
        expected: 'not null',
        actual: result.company_id,
        pass: result.company_id !== null
      },
      {
        name: 'Profile company name matches',
        expected: TEST_DATA.businessName,
        actual: result.profile_company_name,
        pass: result.profile_company_name === TEST_DATA.businessName
      },
      {
        name: 'Industry set correctly',
        expected: TEST_DATA.industry,
        actual: result.industry,
        pass: result.industry === TEST_DATA.industry
      }
    ];
    
    let allPassed = true;
    validations.forEach(v => {
      const status = v.pass ? '✅' : '❌';
      console.log(`${status} ${v.name}`);
      console.log(`   Expected: ${v.expected}, Actual: ${v.actual}`);
      if (!v.pass) allPassed = false;
    });
    
    // Step 7: Cleanup
    console.log('\n📝 Step 6: Cleaning up test data');
    await cleanupTestData();
    
    // Final result
    console.log('\n' + '='.repeat(60));
    if (allPassed) {
      console.log('✅ ALL TESTS PASSED!');
      console.log('\nThe company sync functionality is working correctly.');
      console.log('Companies will now be created with the correct business name');
      console.log('when users submit their business information during signup.');
    } else {
      console.log('❌ SOME TESTS FAILED!');
      console.log('\nPlease review the failures above.');
      process.exit(1);
    }
    console.log('='.repeat(60) + '\n');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
    console.error('Stack:', error.stack);
    
    // Cleanup on error
    try {
      await cleanupTestData();
    } catch (cleanupError) {
      console.error('Failed to cleanup after error:', cleanupError.message);
    }
    
    process.exit(1);
  }
}

// Run the test
testCompanySyncFlow();
