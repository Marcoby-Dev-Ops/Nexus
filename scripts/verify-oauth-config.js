#!/usr/bin/env node

/**
 * OAuth Configuration Verification Script
 * 
 * This script helps verify that all OAuth environment variables are properly configured
 * and that the redirect URIs match between the code and the OAuth provider settings.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 OAuth Configuration Verification\n');

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

// Microsoft OAuth Configuration
console.log('📋 Microsoft OAuth Configuration:');
console.log('================================');

const microsoftVars = {
  'VITE_MICROSOFT_CLIENT_ID': envVars['VITE_MICROSOFT_CLIENT_ID'],
  'VITE_MICROSOFT_CLIENT_SECRET': envVars['VITE_MICROSOFT_CLIENT_SECRET']
};

let microsoftIssues = 0;

Object.entries(microsoftVars).forEach(([key, value]) => {
  if (!value) {
    console.log(`❌ ${key}: Missing`);
    microsoftIssues++;
  } else if (key.includes('SECRET')) {
    console.log(`✅ ${key}: ${value.substring(0, 8)}...`);
  } else {
    console.log(`✅ ${key}: ${value}`);
  }
});

// Check for redirect URI consistency (now using dynamic URIs)
console.log('ℹ️  Using dynamic redirect URIs based on window.location.origin');
console.log('   Expected pattern: ${window.location.origin}/integrations/microsoft365/callback');
console.log('   No hardcoded redirect URIs needed in environment variables');

console.log('\n🔧 Troubleshooting Steps:');
console.log('========================');

if (microsoftIssues > 0) {
  console.log('1. Fix missing environment variables');
  console.log('2. Update Azure App Registration redirect URIs to match your domain');
  console.log('3. Clear browser cache and cookies');
  console.log('4. Try the OAuth flow again');
} else {
  console.log('✅ All Microsoft OAuth variables are configured correctly');
  console.log('If you\'re still having issues:');
  console.log('1. Check Azure App Registration redirect URIs');
  console.log('2. Verify the app has the correct permissions');
  console.log('3. Clear browser cache and cookies');
  console.log('4. Check browser console for errors');
}

console.log('\n🌐 Azure App Registration Checklist:');
console.log('==================================');
console.log('1. Go to https://portal.azure.com/');
console.log('2. Navigate to "Azure Active Directory" > "App registrations"');
console.log('3. Select your Microsoft 365 app');
console.log('4. Go to "Authentication"');
console.log('5. Verify redirect URI matches your domain: https://yourdomain.com/integrations/microsoft365/callback');
console.log('6. Check "API permissions" for required scopes');
console.log('7. Ensure "Grant admin consent" is completed');

console.log('\n📝 Common Issues:');
console.log('=================');
console.log('• Redirect URI must match exactly (including protocol, domain, and path)');
console.log('• Authorization codes expire quickly (usually 5-10 minutes)');
console.log('• State parameter mismatch can cause failures');
console.log('• Browser cache can interfere with OAuth flow');
console.log('• Incorrect client ID or secret will cause token exchange to fail');

if (microsoftIssues === 0) {
  console.log('\n✅ Configuration looks good! Try the OAuth flow again.');
} else {
  console.log(`\n❌ Found ${microsoftIssues} configuration issue(s). Please fix them and try again.`);
  process.exit(1);
}
