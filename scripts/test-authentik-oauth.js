#!/usr/bin/env node

/**
 * Test script to debug Authentik OAuth configuration
 */

import https from 'https';
import http from 'http';

// Configuration
const AUTHENTIK_BASE_URL = 'https://identity.marcoby.com';
const CLIENT_ID = process.env.VITE_AUTHENTIK_CLIENT_ID || 'v6FYo8pTUpSsFRKAoyyOugzA8mMH4H9UupzHffXs';
const CLIENT_SECRET = process.env.AUTHENTIK_CLIENT_SECRET || process.env.VITE_AUTHENTIK_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:5173/auth/callback';

console.log('🔍 Testing Authentik OAuth Configuration...\n');

// Test 1: Check environment variables
console.log('1. Environment Variables:');
console.log(`   Client ID: ${CLIENT_ID ? '✅ Set' : '❌ Missing'}`);
console.log(`   Client Secret: ${CLIENT_SECRET ? '✅ Set' : '❌ Missing'}`);
console.log(`   Redirect URI: ${REDIRECT_URI}`);
console.log('');

// Test 2: Check Authentik endpoints
console.log('2. Testing Authentik Endpoints:');

const endpoints = [
  '/application/o/authorize/',
  '/application/o/token/',
  '/application/o/userinfo/',
  '/application/o/jwks/'
];

endpoints.forEach(endpoint => {
  const url = `${AUTHENTIK_BASE_URL}${endpoint}`;
  console.log(`   Testing: ${url}`);
  
  https.get(url, (res) => {
    console.log(`   ✅ ${endpoint} - Status: ${res.statusCode}`);
  }).on('error', (err) => {
    console.log(`   ❌ ${endpoint} - Error: ${err.message}`);
  });
});

// Test 3: Test server endpoint
console.log('\n3. Testing Server OAuth Endpoint:');

const serverTest = () => {
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/oauth/config/authentik',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      try {
        const config = JSON.parse(data);
        console.log('   ✅ Server endpoint working');
        console.log(`   Client ID: ${config.clientId}`);
        console.log(`   Authorization URL: ${config.authorizationUrl}`);
        console.log(`   Redirect URI: ${config.redirectUri}`);
      } catch (e) {
        console.log('   ❌ Server endpoint error:', data);
      }
    });
  });

  req.on('error', (err) => {
    console.log('   ❌ Server endpoint error:', err.message);
  });

  req.end();
};

// Wait a bit for the endpoint tests to complete
setTimeout(serverTest, 2000);

console.log('\n4. Recommendations:');
console.log('   - Verify Client ID matches Authentik provider configuration');
console.log('   - Verify Client Secret matches Authentik provider configuration');
console.log('   - Verify Redirect URI is configured in Authentik provider');
console.log('   - Check Authentik application is linked to the OAuth provider');
console.log('');
console.log('5. Next Steps:');
console.log('   - Log into Authentik at https://identity.marcoby.com');
console.log('   - Go to Applications → Providers');
console.log('   - Check "Nexus OAuth2 Provider" configuration');
console.log('   - Verify Client ID, Client Secret, and Redirect URIs');
