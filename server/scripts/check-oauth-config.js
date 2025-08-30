#!/usr/bin/env node

/**
 * Check OAuth Configuration
 * 
 * Simple script to check OAuth configuration without external dependencies.
 */

console.log('🔍 Checking OAuth Configuration...\n');

// Check environment variables from process.env
console.log('1. Environment Variables:');
console.log(`   AUTHENTIK_CLIENT_ID: ${process.env.AUTHENTIK_CLIENT_ID ? 'SET' : 'NOT SET'}`);
console.log(`   AUTHENTIK_CLIENT_SECRET: ${process.env.AUTHENTIK_CLIENT_SECRET ? 'SET' : 'NOT SET'}`);
console.log(`   VITE_AUTHENTIK_CLIENT_ID: ${process.env.VITE_AUTHENTIK_CLIENT_ID ? 'SET' : 'NOT SET'}`);

// Check client ID consistency
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

// Expected configuration
console.log('\n3. Expected Configuration:');
console.log('   Client ID: v6FYo8pTUpSsFRKAoyyOugzA8mMH4H9UupzHffXs');
console.log('   Redirect URI: http://localhost:5173/auth/callback');
console.log('   Authentik Base URL: https://identity.marcoby.com');

console.log('\n🔧 Next Steps:');
console.log('1. Verify the client ID and secret in your Authentik application match the environment variables');
console.log('2. Ensure the redirect URI in Authentik includes: http://localhost:5173/auth/callback');
console.log('3. Check that the Authentik application is configured as "Confidential" client type');
console.log('4. Verify the authentication flow is set to "Authorization Code"');

console.log('\n📋 Authentik Application Checklist:');
console.log('   □ Client ID matches: v6FYo8pTUpSsFRKAoyyOugzA8mMH4H9UupzHffXs');
console.log('   □ Client Secret is set and matches environment variable');
console.log('   □ Client Type: Confidential');
console.log('   □ Authentication Flow: Authorization Code');
console.log('   □ Redirect URIs include: http://localhost:5173/auth/callback');
console.log('   □ Scopes include: openid profile email groups');

console.log('\n🌐 Authentik Admin Panel:');
console.log('   https://identity.marcoby.com/admin/');
console.log('   Go to: Applications → Providers → OAuth2/OpenID Provider');
