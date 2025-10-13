#!/usr/bin/env node

/**
 * User Profile Reset and Sync Script
 * 
 * This script helps reset and sync user profiles with Authentik data.
 * It can either:
 * 1. Force sync existing user with Authentik data
 * 2. Delete and recreate user profile from scratch
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { query } = require('./src/database/connection');
const userProfileService = require('./src/services/UserProfileService');
const { logger } = require('./src/utils/logger');

// Your actual Authentik user data (from the MCP query we did earlier)
const YOUR_AUTHENTIK_DATA = {
  id: 'd2770389274aad9319e41dc713cb5c8206cc84f0cadf10e49c17dc329e66eec3', // Your actual user ID
  email: 'vonj@marcoby.com',
  name: 'Von Johnson',
  attributes: {
    first_name: 'Von',
    last_name: 'Johnson',
    business_name: 'Marcoby',
    industry: 'technology',
    company_size: '1-10',
    business_type: 'Technology Company',
    funding_stage: 'bootstrap',
    revenue_range: '0-100k',
    signup_completed: true,
    enrollment_flow_completed: true,
    business_profile_completed: true,
    signup_completion_date: '2024-01-15T10:30:00Z'
  }
};

async function findExistingUser(userId) {
  console.log(`🔍 Searching for existing user: ${userId}`);
  
  const result = await query(
    'SELECT id, first_name, last_name, email, company_name, signup_completed, created_at, updated_at FROM user_profiles WHERE id = $1',
    [userId]
  );
  
  if (result.error) {
    console.log('❌ Database error:', result.error);
    return null;
  }
  
  if (result.data && result.data.length > 0) {
    const user = result.data[0];
    console.log('✅ Found existing user:');
    console.table([user]);
    return user;
  } else {
    console.log('ℹ️  No existing user found');
    return null;
  }
}

async function deleteUser(userId) {
  console.log(`🗑️  Deleting user: ${userId}`);
  
  // Delete user profile (this should cascade to related data)
  const result = await query('DELETE FROM user_profiles WHERE id = $1', [userId]);
  
  if (result.error) {
    console.log('❌ Error deleting user:', result.error);
    return false;
  }
  
  console.log('✅ User deleted successfully');
  return true;
}

async function forceSyncUser(userId) {
  console.log(`🔄 Force syncing user with Authentik data: ${userId}`);
  
  try {
    // Use the ensureUserProfile method with force sync
    const result = await userProfileService.ensureUserProfile(
      userId,
      YOUR_AUTHENTIK_DATA.email,
      {}, // Empty updates to trigger sync
      YOUR_AUTHENTIK_DATA // Full JWT payload
    );
    
    if (result.success) {
      console.log('✅ User sync completed successfully');
      console.log('Profile data:');
      console.table([{
        id: result.data.id,
        first_name: result.data.first_name,
        last_name: result.data.last_name,
        email: result.data.email,
        company_name: result.data.company_name,
        signup_completed: result.data.signup_completed
      }]);
      
      if (result.company) {
        console.log('Company data:');
        console.table([result.company]);
      }
      
      return true;
    } else {
      console.log('❌ Sync failed:', result.error);
      return false;
    }
    
  } catch (error) {
    console.log('❌ Sync error:', error.message);
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  console.log('🔧 Nexus User Profile Reset & Sync Tool');
  console.log('='.repeat(50));
  
  if (!command || !['sync', 'delete', 'recreate'].includes(command)) {
    console.log(`
Usage: node user-reset.js <command>

Commands:
  sync      - Force sync existing user with Authentik data
  delete    - Delete existing user profile  
  recreate  - Delete and recreate user with Authentik data

Your Authentik User ID: ${YOUR_AUTHENTIK_DATA.id}
Your Email: ${YOUR_AUTHENTIK_DATA.email}
`);
    process.exit(1);
  }
  
  const userId = YOUR_AUTHENTIK_DATA.id;
  
  try {
    // Check if user exists
    const existingUser = await findExistingUser(userId);
    
    switch (command) {
      case 'sync':
        if (!existingUser) {
          console.log('ℹ️  No existing user found, creating new profile...');
        }
        await forceSyncUser(userId);
        break;
        
      case 'delete':
        if (existingUser) {
          await deleteUser(userId);
        } else {
          console.log('ℹ️  No user to delete');
        }
        break;
        
      case 'recreate':
        if (existingUser) {
          console.log('🔄 Deleting existing user...');
          await deleteUser(userId);
        }
        console.log('🔄 Creating new user with Authentik data...');
        await forceSyncUser(userId);
        break;
    }
    
    console.log('\n✅ Operation completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Clear your browser cache/cookies');
    console.log('2. Log out and log back in through Authentik');
    console.log('3. Check that the dashboard shows correct user info');
    
  } catch (error) {
    console.error('❌ Operation failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { forceSyncUser, deleteUser, findExistingUser, YOUR_AUTHENTIK_DATA };