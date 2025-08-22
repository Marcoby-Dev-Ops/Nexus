#!/usr/bin/env node

/**
 * Verify Server Environment Variables
 * 
 * This script verifies that the server is properly loading environment variables.
 */

const { config } = require('dotenv');
const path = require('path');

// Load environment variables from root directory
config({ path: path.join(__dirname, '..', '.env') });

console.log('🔍 Verifying Server Environment Variables...\n');

// Check if environment variables are loaded
const clientId = process.env.AUTHENTIK_CLIENT_ID;
const clientSecret = process.env.AUTHENTIK_CLIENT_SECRET;
const viteClientId = process.env.VITE_AUTHENTIK_CLIENT_ID;

console.log('Environment Variables Status:');
console.log(`   AUTHENTIK_CLIENT_ID: ${clientId ? '✅ LOADED' : '❌ NOT LOADED'}`);
console.log(`   AUTHENTIK_CLIENT_SECRET: ${clientSecret ? '✅ LOADED' : '❌ NOT LOADED'}`);
console.log(`   VITE_AUTHENTIK_CLIENT_ID: ${viteClientId ? '✅ LOADED' : '❌ NOT LOADED'}`);

if (clientId && clientSecret) {
  console.log('\n✅ Environment variables are properly loaded!');
  console.log(`   Client ID: ${clientId.substring(0, 8)}...`);
  console.log(`   Client Secret: ${clientSecret.substring(0, 8)}...`);
  
  console.log('\n🔧 Next Steps:');
  console.log('1. Restart your development server: npm run dev:api');
  console.log('2. Test the OAuth flow in your application');
  console.log('3. Check Authentik application configuration matches these values');
} else {
  console.log('\n❌ Environment variables are not loaded!');
  console.log('\n🔧 Troubleshooting:');
  console.log('1. Check that the .env file exists in the root directory');
  console.log('2. Verify the .env file contains the correct values');
  console.log('3. Make sure the server is loading the .env file');
  console.log('4. Restart the server after making changes');
}

console.log('\n📋 Authentik Configuration Checklist:');
console.log('   □ Client ID matches: v6FYo8pTUpSsFRKAoyyOugzA8mMH4H9UupzHffXs');
console.log('   □ Client Secret is set and matches environment variable');
console.log('   □ Client Type: Confidential');
console.log('   □ Authentication Flow: Authorization Code');
console.log('   □ Redirect URIs include: http://localhost:5173/auth/callback');
console.log('   □ Scopes include: openid profile email groups');
