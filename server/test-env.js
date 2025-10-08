#!/usr/bin/env node

/**
 * Test Environment Variables Loading
 */

require('./loadEnv');

console.log('🔍 Testing Server Environment Variables...\n');

// Check environment variables
const clientId = process.env.AUTHENTIK_CLIENT_ID;
const clientSecret = process.env.AUTHENTIK_CLIENT_SECRET;

console.log('Environment Variables:');
console.log(`   AUTHENTIK_CLIENT_ID: ${clientId ? '✅ SET' : '❌ NOT SET'}`);
console.log(`   AUTHENTIK_CLIENT_SECRET: ${clientSecret ? '✅ SET' : '❌ NOT SET'}`);

if (clientId && clientSecret) {
  console.log('\n✅ Environment variables are properly loaded!');
  console.log(`   Client ID: ${clientId.substring(0, 8)}...`);
  console.log(`   Client Secret: ${clientSecret.substring(0, 8)}...`);
  
  console.log('\n🔧 Next Steps:');
  console.log('1. Restart the server: npm run dev');
  console.log('2. Test the OAuth flow in your application');
} else {
  console.log('\n❌ Environment variables are not loaded!');
  console.log('\n🔧 Troubleshooting:');
  console.log('1. Check that the .env file exists in the server directory');
  console.log('2. Verify the .env file contains the correct values');
  console.log('3. Make sure the server is loading the server/.env file');
}

console.log('\n📋 Expected Values:');
console.log('   AUTHENTIK_CLIENT_ID: v6FYo8pTUpSsFRKAoyyOugzA8mMH4H9UupzHffXs');
console.log('   AUTHENTIK_CLIENT_SECRET: gXrNdkAxniLt2XhTAFIl0Dd2iSaC0gdeDsDAIikOy1tYjFOESu4RmhLFXYKJMWCuUjhrxoeHGhXxMIGjbcXyqN0o90gz8Ail8MM2jKTXD2nHFnIYSelU1EbNCdlEJHzo');
