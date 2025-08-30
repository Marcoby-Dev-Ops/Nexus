#!/usr/bin/env node

/**
 * HubSpot Environment Setup Script
 * This script helps you set up HubSpot environment variables for real data integration
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupHubSpotEnv() {
  console.log('🚀 HubSpot Environment Setup\n');
  console.log('This script will help you set up HubSpot environment variables for real data integration.\n');
  
  console.log('📋 Prerequisites:');
  console.log('1. HubSpot account (free or paid)');
  console.log('2. HubSpot Developer App created with OAuth credentials');
  console.log('3. Client ID and Client Secret from your HubSpot app\n');
  
  const hasHubSpotApp = await question('Do you have a HubSpot Developer App with OAuth credentials? (y/n): ');
  
  if (hasHubSpotApp.toLowerCase() !== 'y') {
    console.log('\n❌ Please create a HubSpot Developer App first.');
    console.log('📖 Follow the guide at: docs/current/development/HUBSPOT_SETUP_GUIDE.md');
    rl.close();
    return;
  }
  
  console.log('\n🔧 Enter your HubSpot app credentials:');
  
  const clientId = await question('HubSpot Client ID: ');
  const clientSecret = await question('HubSpot Client Secret: ');
  
  if (!clientId || !clientSecret) {
    console.log('\n❌ Both Client ID and Client Secret are required.');
    rl.close();
    return;
  }
  
  // Create .env.local file content
  const envContent = `# HubSpot Configuration
VITE_HUBSPOT_CLIENT_ID=${clientId}
VITE_HUBSPOT_CLIENT_SECRET=${clientSecret}
HUBSPOT_CLIENT_ID=${clientId}
HUBSPOT_CLIENT_SECRET=${clientSecret}

# Note: Add these to your production environment variables as well
`;
  
  const envPath = path.join(process.cwd(), '.env.local');
  
  try {
    fs.writeFileSync(envPath, envContent);
    console.log('\n✅ HubSpot environment variables created successfully!');
    console.log(`📁 File created: ${envPath}`);
    console.log('\n🔄 Next steps:');
    console.log('1. Restart your development server');
    console.log('2. Navigate to /integrations in your app');
    console.log('3. Connect HubSpot using the OAuth flow');
    console.log('4. Navigate to /integrations/client-intelligence to see real data');
  } catch (error) {
    console.error('\n❌ Error creating environment file:', error.message);
  }
  
  rl.close();
}

setupHubSpotEnv().catch(console.error);
