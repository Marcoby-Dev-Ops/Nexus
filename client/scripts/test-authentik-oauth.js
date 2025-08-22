#!/usr/bin/env node

/**
 * Test Authentik OAuth Configuration
 * 
 * This script tests the Authentik OAuth configuration to identify the issue.
 */

const { config } = require('dotenv');
const path = require('path');

// Load environment variables from root directory
config({ path: path.join(__dirname, '..', '.env') });

console.log('🔍 Testing Authentik OAuth Configuration...\n');

// Test 1: Check environment variables
console.log('1. Environment Variables:');
console.log(`   AUTHENTIK_CLIENT_ID: ${process.env.AUTHENTIK_CLIENT_ID ? 'SET' : 'NOT SET'}`);
console.log(`   AUTHENTIK_CLIENT_SECRET: ${process.env.AUTHENTIK_CLIENT_SECRET ? 'SET' : 'NOT SET'}`);
console.log(`   VITE_AUTHENTIK_CLIENT_ID: ${process.env.VITE_AUTHENTIK_CLIENT_ID ? 'SET' : 'NOT SET'}`);

// Test 2: Check client ID consistency
console.log('\n2. Client ID Consistency:');
const serverClientId = process.env.AUTHENTIK_CLIENT_ID;
const clientClientId = process.env.VITE_AUTHENTIK_CLIENT_ID;

if (serverClientId === clientClientId) {
  console.log('   ✅ Server and client client IDs match');
} else {
  console.log('   ❌ Server and client client IDs do not match');
  console.log(`   Server: ${serverClientId}`);
  console.log(`   Client: ${clientClientId}`);
}

// Test 3: Check redirect URI
console.log('\n3. Redirect URI Configuration:');
const redirectUri = 'http://localhost:5173/auth/callback';
console.log(`   Expected Redirect URI: ${redirectUri}`);

// Test 4: Check Authentik endpoints
console.log('\n4. Authentik Endpoints:');
const endpoints = [
  'https://identity.marcoby.com/application/o/authorize/',
  'https://identity.marcoby.com/application/o/token/',
  'https://identity.marcoby.com/application/o/userinfo/',
];

endpoints.forEach(endpoint => {
  console.log(`   ${endpoint}`);
});

// Test 5: Check server endpoint
console.log('\n5. Server Endpoint:');
console.log('   http://localhost:3001/api/oauth/config/authentik');

console.log('\n🔧 Next Steps:');
console.log('1. Verify the client ID and secret in your Authentik application match the environment variables');
console.log('2. Ensure the redirect URI in Authentik includes: http://localhost:5173/auth/callback');
console.log('3. Check that the Authentik application is configured as "Confidential" client type');
console.log('4. Verify the authentication flow is set to "Authorization Code"');
console.log('5. Make sure the client secret is properly configured in Authentik');

console.log('\n📋 Authentik Application Checklist:');
console.log('   □ Client ID matches: v6FYo8pTUpSsFRKAoyyOugzA8mMH4H9UupzHffXs');
console.log('   □ Client Secret is set and matches environment variable');
console.log('   □ Client Type: Confidential');
console.log('   □ Authentication Flow: Authorization Code');
console.log('   □ Redirect URIs include: http://localhost:5173/auth/callback');
console.log('   □ Scopes include: openid profile email groups');
