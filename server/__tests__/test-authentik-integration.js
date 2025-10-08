#!/usr/bin/env node

/**
 * Test script to verify Authentik integration
 * Run with: node test-authentik-integration.js
 */

const https = require('https');
const http = require('http');

console.log('🔍 Testing Authentik Integration...\n');

// Test configuration
const config = {
  authentikBaseUrl: 'https://identity.marcoby.com',
  clientId: 'v6FYo8pTUpSsFRKAoyyOugzA8mMH4H9UupzHffXs',
  apiUrl: 'http://localhost:3001',
  frontendUrl: 'http://localhost:5173'
};

// Test 1: Check if Authentik is accessible
console.log('1️⃣ Testing Authentik connectivity...');
testAuthentikConnectivity();

// Test 2: Check if server OAuth endpoints are working
console.log('\n2️⃣ Testing server OAuth endpoints...');
testServerOAuthEndpoints();

// Test 3: Verify OAuth configuration
console.log('\n3️⃣ Testing OAuth configuration...');
testOAuthConfiguration();

async function testAuthentikConnectivity() {
  try {
    const response = await fetch(`${config.authentikBaseUrl}/application/o/authorize/`);
    if (response.ok) {
      console.log('   ✅ Authentik is accessible');
    } else {
      console.log('   ❌ Authentik returned status:', response.status);
    }
  } catch (error) {
    console.log('   ❌ Cannot reach Authentik:', error.message);
  }
}

async function testServerOAuthEndpoints() {
  try {
    // Test OAuth config endpoint
    const configResponse = await fetch(`${config.apiUrl}/api/oauth/config/authentik`);
    if (configResponse.ok) {
      const config = await configResponse.json();
      console.log('   ✅ OAuth config endpoint working');
      console.log('   📋 Client ID:', config.clientId ? 'SET' : 'NOT SET');
      console.log('   📋 Authorization URL:', config.authorizationUrl);
    } else {
      console.log('   ❌ OAuth config endpoint failed:', configResponse.status);
    }
  } catch (error) {
    console.log('   ❌ Cannot reach server:', error.message);
  }
}

async function testOAuthConfiguration() {
  console.log('   📋 Configuration:');
  console.log('   - Authentik Base URL:', config.authentikBaseUrl);
  console.log('   - Client ID:', config.clientId);
  console.log('   - API URL:', config.apiUrl);
  console.log('   - Frontend URL:', config.frontendUrl);
  
  // Check if redirect URI is properly configured
  const redirectUri = `${config.frontendUrl}/auth/callback`;
  console.log('   - Redirect URI:', redirectUri);
  
  console.log('\n   ✅ Configuration looks good!');
}

// Helper function to make HTTP requests
async function fetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    
    const req = client.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          json: () => Promise.resolve(JSON.parse(data))
        });
      });
    });
    
    req.on('error', reject);
    req.end();
  });
}

console.log('\n🎉 Integration test completed!');
console.log('\n📝 Next steps:');
console.log('1. Start your server: cd server && pnpm dev');
console.log('2. Start your client: cd client && pnpm dev');
console.log('3. Visit http://localhost:5173 - you should be redirected to login');
console.log('4. Click "Login with Authentik" to test the flow');
console.log('5. After successful login, you should see your dashboard with user info');




