#!/usr/bin/env node

/**
 * Test OAuth Configuration
 * 
 * This script tests the OAuth configuration to ensure:
 * 1. Environment variables are set correctly
 * 2. Server endpoints are accessible
 * 3. Authentik configuration is valid
 */

import https from 'https';
import http from 'http';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, '..', '.env') });

console.log('🔍 Testing OAuth Configuration...\n');

// Test 1: Check environment variables
console.log('1. Checking environment variables...');
const requiredEnvVars = [
  'VITE_AUTHENTIK_CLIENT_ID',
  'AUTHENTIK_CLIENT_SECRET'
];

let envVarsOk = true;
for (const envVar of requiredEnvVars) {
  const value = process.env[envVar];
  if (!value || value === 'your_authentik_client_id_here' || value === 'your_authentik_client_secret_here') {
    console.log(`❌ ${envVar}: Not set or using default value`);
    envVarsOk = false;
  } else {
    console.log(`✅ ${envVar}: Set (${value.substring(0, 8)}...)`);
  }
}

if (!envVarsOk) {
  console.log('\n⚠️  Please set the required environment variables in .env.local');
  process.exit(1);
}

// Test 2: Check Authentik endpoints
console.log('\n2. Checking Authentik endpoints...');

const authentikEndpoints = [
  'https://identity.marcoby.com/application/o/authorize/',
  'https://identity.marcoby.com/application/o/token/',
  'https://identity.marcoby.com/application/o/userinfo/',
  'https://identity.marcoby.com/application/o/jwks/'
];

async function checkEndpoint(url) {
  return new Promise((resolve) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, (res) => {
      resolve({ url, status: res.statusCode, ok: res.statusCode < 400 });
    });
    
    req.on('error', (err) => {
      resolve({ url, status: 'ERROR', ok: false, error: err.message });
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      resolve({ url, status: 'TIMEOUT', ok: false, error: 'Request timeout' });
    });
  });
}

async function testEndpoints() {
  for (const endpoint of authentikEndpoints) {
    const result = await checkEndpoint(endpoint);
    if (result.ok) {
      console.log(`✅ ${endpoint}: ${result.status}`);
    } else {
      console.log(`❌ ${endpoint}: ${result.status} ${result.error || ''}`);
    }
  }
}

await testEndpoints();

// Test 3: Check server endpoints (if server is running)
console.log('\n3. Checking server endpoints...');

const serverEndpoints = [
  'http://localhost:3001/api/oauth/config/authentik',
  'http://localhost:3001/api/oauth/token'
];

async function testServerEndpoints() {
  for (const endpoint of serverEndpoints) {
    try {
      const response = await fetch(endpoint, { 
        method: 'GET',
        timeout: 5000 
      });
      if (response.ok) {
        console.log(`✅ ${endpoint}: ${response.status}`);
      } else {
        console.log(`❌ ${endpoint}: ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint}: ${error.message}`);
    }
  }
}

await testServerEndpoints();

console.log('\n✅ OAuth configuration test completed!');
console.log('\nNext steps:');
console.log('1. Ensure your Authentik application is configured with the correct redirect URI');
console.log('2. Verify the client ID and secret match your Authentik application');
console.log('3. Test the OAuth flow by visiting the login page');
