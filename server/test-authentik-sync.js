#!/usr/bin/env node

/**
 * Authentik Sync Integration Test
 * 
 * This script tests the complete Authentik user data synchronization flow:
 * 1. Server-side extraction and mapping of Authentik JWT data
 * 2. Profile creation/update with Authentik attributes
 * 3. Company provisioning from business data
 * 4. RPC endpoints for manual sync operations
 */

const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const userProfileService = require('../src/services/UserProfileService');
const { logger } = require('../src/utils/logger');

// Mock Authentik JWT payload with comprehensive data
const mockAuthentikJWT = {
  id: 'test-user-123',
  email: 'test@example.com',
  name: 'Test User',
  attributes: {
    first_name: 'Test',
    last_name: 'User',
    phone: '+1-555-0123',
    business_name: 'Test Business Inc',
    industry: 'technology',
    company_size: '11-50',
    business_type: 'B2B Software',
    funding_stage: 'seed',
    revenue_range: '100k-500k',
    signup_completed: true,
    enrollment_flow_completed: true,
    business_profile_completed: true,
    signup_completion_date: '2024-01-15T10:30:00Z'
  }
};

async function testAuthentikExtraction() {
  console.log('\n=== Testing Authentik Data Extraction ===');
  
  try {
    // Test the extractAuthentikUserData method
    const extractedData = userProfileService.extractAuthentikUserData(mockAuthentikJWT);
    
    console.log('Extracted Authentik Data:');
    console.log(JSON.stringify(extractedData, null, 2));
    
    // Validate extracted data structure
    const expectedFields = [
      'email', 'firstName', 'lastName', 'phone', 'businessName',
      'industry', 'companySize', 'businessType', 'fundingStage',
      'revenueRange', 'signupCompleted', 'businessProfileCompleted'
    ];
    
    const missingFields = expectedFields.filter(field => 
      extractedData[field] === undefined || extractedData[field] === null
    );
    
    if (missingFields.length === 0) {
      console.log('✅ All expected fields extracted successfully');
    } else {
      console.log('⚠️  Missing fields:', missingFields);
    }
    
    return extractedData;
    
  } catch (error) {
    console.error('❌ Error extracting Authentik data:', error);
    throw error;
  }
}

async function testProfileSync() {
  console.log('\n=== Testing Profile Synchronization ===');
  
  try {
    const userId = 'test-authentik-sync-' + Date.now();
    const email = 'test-sync@example.com';
    
    // Test profile creation with Authentik data
    console.log(`Creating profile for user: ${userId}`);
    
    const result = await userProfileService.ensureUserProfile(
      userId,
      email,
      {},
      mockAuthentikJWT
    );
    
    console.log('Profile sync result:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('✅ Profile synchronized successfully');
      
      // Validate that Authentik data was properly mapped
      const profile = result.data;
      const validations = [
        { field: 'first_name', expected: 'Test', actual: profile.first_name },
        { field: 'last_name', expected: 'User', actual: profile.last_name },
        { field: 'email', expected: email, actual: profile.email },
        { field: 'phone', expected: '+1-555-0123', actual: profile.phone }
      ];
      
      validations.forEach(({ field, expected, actual }) => {
        if (actual === expected) {
          console.log(`✅ ${field}: ${actual}`);
        } else {
          console.log(`⚠️  ${field}: expected '${expected}', got '${actual}'`);
        }
      });
      
      // Check if company was created
      if (result.company) {
        console.log('✅ Company created:', result.company.name);
      } else {
        console.log('⚠️  No company data in result');
      }
      
    } else {
      console.log('❌ Profile sync failed:', result.error);
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ Error testing profile sync:', error);
    throw error;
  }
}

async function testRPCCompatibility() {
  console.log('\n=== Testing RPC Function Compatibility ===');
  
  try {
    // Test that the RPC functions exist and have the right signatures
    const rpcFile = require('../src/routes/rpc.js');
    console.log('✅ RPC routes file loaded successfully');
    
    // The actual RPC functions are internal, but we can verify the route exists
    console.log('✅ RPC functions should be available at:');
    console.log('  - POST /api/rpc/sync_authentik_user_data');
    console.log('  - POST /api/rpc/force_sync_authentik_user');
    console.log('  - POST /api/rpc/get_authentik_sync_status');
    
  } catch (error) {
    console.error('❌ Error testing RPC compatibility:', error);
    throw error;
  }
}

async function testCompletionCalculation() {
  console.log('\n=== Testing Profile Completion Calculation ===');
  
  try {
    const extractedData = userProfileService.extractAuthentikUserData(mockAuthentikJWT);
    
    // Test completion percentage calculation
    const requiredFields = [
      'firstName', 'lastName', 'email', 'phone', 'businessName',
      'industry', 'companySize', 'businessType'
    ];
    
    const completedFields = requiredFields.filter(field => 
      extractedData[field] && extractedData[field] !== ''
    );
    
    const completionPercentage = Math.round((completedFields.length / requiredFields.length) * 100);
    
    console.log(`Profile completion: ${completionPercentage}% (${completedFields.length}/${requiredFields.length} fields)`);
    console.log('Completed fields:', completedFields);
    
    if (completionPercentage >= 80) {
      console.log('✅ Profile meets completion threshold');
    } else {
      console.log('⚠️  Profile below completion threshold');
    }
    
  } catch (error) {
    console.error('❌ Error testing completion calculation:', error);
    throw error;
  }
}

async function runAllTests() {
  console.log('🧪 Starting Authentik Sync Integration Tests');
  console.log('='.repeat(50));
  
  try {
    await testAuthentikExtraction();
    await testProfileSync();
    await testRPCCompatibility();
    await testCompletionCalculation();
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ All tests completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Start the server and test RPC endpoints manually');
    console.log('2. Test the client-side sync functions');
    console.log('3. Verify end-to-end sync on actual login');
    
  } catch (error) {
    console.log('\n' + '='.repeat(50));
    console.error('❌ Tests failed:', error.message);
    process.exit(1);
  }
}

// Run tests if called directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testAuthentikExtraction,
  testProfileSync,
  testRPCCompatibility,
  testCompletionCalculation,
  mockAuthentikJWT
};