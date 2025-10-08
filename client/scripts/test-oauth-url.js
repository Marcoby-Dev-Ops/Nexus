#!/usr/bin/env node

/**
 * Test OAuth URL Generation Script
 * 
 * This script helps test the OAuth URL generation to ensure the redirect URI is correct.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 OAuth URL Test\n');

// Check if .env file exists
const envPath = path.join(path.dirname(__dirname), '.env');
if (!fs.existsSync(envPath)) {
  console.log('❌ .env file not found');
  process.exit(1);
}

// Read .env file
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

const clientId = envVars['VITE_MICROSOFT_CLIENT_ID'];
const clientSecret = envVars['VITE_MICROSOFT_CLIENT_SECRET'];

if (!clientId) {
  console.log('❌ VITE_MICROSOFT_CLIENT_ID not found');
  process.exit(1);
}

console.log('📋 Microsoft OAuth Configuration:');
console.log('================================');
console.log(`✅ Client ID: ${clientId}`);
console.log(`✅ Client Secret: ${clientSecret ? 'Present' : 'Missing'}`);

// Test different domains
const testDomains = [
  'http://localhost:5173',
  'https://nexus.marcoby.com',
  'https://nexus.marcoby.net',
  'https://nexux.marcoby.net'
];

console.log('\n🌐 OAuth URLs for different domains:');
console.log('====================================');

testDomains.forEach(domain => {
  const redirectUri = `${domain}/integrations/microsoft365/callback`;
  const authUrl = new URL('https://login.microsoftonline.com/common/oauth2/v2.0/authorize');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('scope', 'User.Read Mail.Read Mail.ReadWrite Calendars.Read Files.Read.All Contacts.Read offline_access');
  authUrl.searchParams.set('state', 'test-user-id');
  authUrl.searchParams.set('response_mode', 'query');
  
  console.log(`\n📍 Domain: ${domain}`);
  console.log(`   Redirect URI: ${redirectUri}`);
  console.log(`   OAuth URL: ${authUrl.toString()}`);
});

console.log('\n🔧 Troubleshooting Steps:');
console.log('========================');
console.log('1. Check which domain you\'re currently using');
console.log('2. Verify that exact redirect URI is configured in Azure App Registration');
console.log('3. Make sure the redirect URI includes the full path: /integrations/microsoft365/callback');
console.log('4. Check that the protocol (http/https) matches your domain');
console.log('5. Ensure the domain is exactly the same (no www vs non-www mismatch)');

console.log('\n🌐 Azure App Registration Setup:');
console.log('================================');
console.log('1. Go to https://portal.azure.com/');
console.log('2. Navigate to "Azure Active Directory" > "App registrations"');
console.log('3. Select your Microsoft 365 app');
console.log('4. Go to "Authentication"');
console.log('5. Add ALL the redirect URIs shown above that you might use');
console.log('6. Make sure to include both http and https versions if needed');

console.log('\n💡 Common Issues:');
console.log('=================');
console.log('• Redirect URI must match exactly (including trailing slashes)');
console.log('• Protocol mismatch (http vs https)');
console.log('• Domain mismatch (www vs non-www)');
console.log('• Missing or extra path segments');
console.log('• Case sensitivity in the path');

console.log('\n✅ Test completed! Use the OAuth URL that matches your current domain.');
