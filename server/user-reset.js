#!/usr/bin/env node

/**
 * User Management CLI Tool
 * 
 * A generalized tool for managing user profiles in the Nexus system.
 * Can be used to:
 * 1. Find users by email or user_id
 * 2. Sync user profiles with Authentik data
 * 3. Delete user profiles and associated data
 * 4. Recreate user profiles from Authentik
 * 
 * Usage:
 *   node user-reset.js find <email>
 *   node user-reset.js sync <email|user_id>
 *   node user-reset.js delete <email|user_id> [--confirm]
 *   node user-reset.js recreate <email|user_id>
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { query } = require('./src/database/connection');
const userProfileService = require('./src/services/UserProfileService');
const { logger } = require('./src/utils/logger');

// Authentik API configuration
const AUTHENTIK_BASE_URL = process.env.AUTHENTIK_BASE_URL || 'https://identity.marcoby.com';
const AUTHENTIK_API_TOKEN = process.env.AUTHENTIK_API_TOKEN;

/**
 * Fetch user data from Authentik by email or username
 */
async function fetchAuthentikUser(emailOrUsername) {
  try {
    const response = await fetch(
      `${AUTHENTIK_BASE_URL}/api/v3/core/users/?search=${encodeURIComponent(emailOrUsername)}`,
      {
        headers: {
          'Authorization': `Bearer ${AUTHENTIK_API_TOKEN}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Authentik API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      // Return the first matching user
      const user = data.results[0];
      return {
        id: user.uid, // Authentik user hash
        pk: user.pk,
        email: user.email,
        username: user.username,
        name: user.name,
        attributes: user.attributes || {}
      };
    }

    return null;
  } catch (error) {
    console.error('❌ Failed to fetch Authentik user:', error.message);
    return null;
  }
}

/**
 * Find user profile by user_id or email
 */
async function findExistingUser(identifier) {
  console.log(`🔍 Searching for user: ${identifier}`);
  
  // Check if identifier looks like an email
  const isEmail = identifier.includes('@');
  
  const result = await query(
    isEmail
      ? 'SELECT id, user_id, first_name, last_name, email, company_id, company_name, signup_completed, created_at, updated_at FROM user_profiles WHERE email = $1'
      : 'SELECT id, user_id, first_name, last_name, email, company_id, company_name, signup_completed, created_at, updated_at FROM user_profiles WHERE user_id = $1',
    [identifier]
  );
  
  if (result.error) {
    console.log('❌ Database error:', result.error);
    return null;
  }
  
  if (result.data && result.data.length > 0) {
    const user = result.data[0];
    console.log('✅ Found user profile:');
    console.table([{
      user_id: user.user_id.substring(0, 16) + '...',
      email: user.email,
      name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'N/A',
      company: user.company_name || 'N/A',
      created: user.created_at
    }]);
    return user;
  } else {
    console.log('ℹ️  No user profile found in database');
    return null;
  }
}

async function deleteUser(userId) {
  console.log(`🗑️  Deleting user profile and associated data: ${userId}`);
  
  try {
    // First get the user's company_id if they own a company
    const userResult = await query(
      'SELECT id, user_id, company_id FROM user_profiles WHERE user_id = $1',
      [userId]
    );
    
    if (userResult.data && userResult.data.length > 0) {
      const user = userResult.data[0];
      let companyIdToDelete = null;
      
      // Check if user owns a company
      if (user.company_id) {
        const companyResult = await query(
          'SELECT id, owner_id FROM companies WHERE id = $1',
          [user.company_id]
        );
        
        if (companyResult.data && companyResult.data.length > 0) {
          const company = companyResult.data[0];
          
          // If user owns this company, save it for deletion after profile
          if (company.owner_id === userId) {
            companyIdToDelete = user.company_id;
            console.log(`� Will delete owned company: ${companyIdToDelete}`);
          }
        }
      }
      
      // Delete user profile first (removes foreign key constraint)
      console.log(`🗑️  Deleting user profile...`);
      const deleteResult = await query('DELETE FROM user_profiles WHERE user_id = $1', [userId]);
      
      if (deleteResult.error) {
        console.log('❌ Error deleting user profile:', deleteResult.error);
        return false;
      }
      
      console.log('✅ User profile deleted');
      
      // Now delete the company if user owned it
      if (companyIdToDelete) {
        console.log(`🗑️  Deleting company: ${companyIdToDelete.substring(0, 8)}...`);
        const companyDeleteResult = await query('DELETE FROM companies WHERE id = $1', [companyIdToDelete]);
        
        if (companyDeleteResult.error) {
          console.log('⚠️  Warning: Could not delete company:', companyDeleteResult.error);
          console.log('ℹ️  Company may have other users associated with it');
        } else {
          console.log('✅ Company deleted');
        }
      }
      
      console.log('✅ All data deleted successfully');
      return true;
    } else {
      console.log('ℹ️  No user found to delete');
      return false;
    }
  } catch (error) {
    console.log('❌ Error during deletion:', error.message);
    return false;
  }
}

/**
 * Sync user profile with data from Authentik
 */
async function syncUserProfile(authentikUser) {
  console.log(`🔄 Syncing user profile with Authentik data: ${authentikUser.email}`);
  
  try {
    // Use the ensureUserProfile method with force sync
    const result = await userProfileService.ensureUserProfile(
      authentikUser.id,
      authentikUser.email,
      {}, // Empty updates to trigger sync
      authentikUser // Full user data with attributes
    );
    
    if (result.success) {
      console.log('✅ User profile sync completed successfully');
      
      // Query the full profile to show results
      const profileResult = await query(
        'SELECT * FROM user_profiles WHERE user_id = $1',
        [authentikUser.id]
      );
      
      if (profileResult.data && profileResult.data.length > 0) {
        const profile = profileResult.data[0];
        console.log('\n📋 Profile data:');
        console.table([{
          user_id: profile.user_id.substring(0, 20) + '...',
          email: profile.email,
          first_name: profile.first_name || 'N/A',
          last_name: profile.last_name || 'N/A',
          phone: profile.phone || 'N/A',
          company_name: profile.company_name || 'N/A',
          signup_completed: profile.signup_completed,
          completion: profile.profile_completion_percentage + '%'
        }]);
        
        // Get company data if associated
        if (profile.company_id) {
          const companyResult = await query(
            'SELECT * FROM companies WHERE id = $1',
            [profile.company_id]
          );
          
          if (companyResult.data && companyResult.data.length > 0) {
            const company = companyResult.data[0];
            console.log('\n🏢 Company data:');
            console.table([{
              id: company.id.substring(0, 8) + '...',
              name: company.name,
              industry: company.industry || 'N/A',
              size: company.size || 'N/A',
              description: (company.description || 'N/A').substring(0, 50),
              business_identity: JSON.stringify(company.business_identity || {}).substring(0, 50) + '...'
            }]);
          }
        }
      }
      
      return true;
    } else {
      console.log('❌ Sync failed:', result.error);
      return false;
    }
    
  } catch (error) {
    console.log('❌ Sync error:', error.message);
    console.error(error.stack);
    return false;
  }
}

/**
 * Main CLI handler
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const identifier = args[1];
  const flags = args.slice(2);
  
  console.log('🔧 Nexus User Management Tool');
  console.log('='.repeat(60));
  
  if (!command || !['find', 'sync', 'delete', 'recreate'].includes(command)) {
    console.log(`
Usage: node user-reset.js <command> <email|user_id> [options]

Commands:
  find <email|user_id>           - Find and display user info
  sync <email|user_id>           - Sync user profile with Authentik data
  delete <email|user_id>         - Delete user profile and associated data
  recreate <email|user_id>       - Delete and recreate from Authentik

Options:
  --confirm                      - Skip confirmation prompts (use with caution)

Examples:
  node user-reset.js find vonj@marcoby.com
  node user-reset.js sync vonj@marcoby.com
  node user-reset.js delete vonj@marcoby.com
  node user-reset.js recreate vonj@marcoby.com
`);
    process.exit(1);
  }
  
  if (!identifier && command !== 'find') {
    console.log('❌ Error: User email or user_id is required');
    process.exit(1);
  }
  
  try {
    const needsConfirm = flags.includes('--confirm') ? false : true;
    
    // For all commands, first check if user exists in database
    const existingUser = await findExistingUser(identifier);
    
    // Fetch Authentik user data for sync/recreate operations
    let authentikUser = null;
    if (['sync', 'recreate'].includes(command)) {
      console.log('\n🔍 Fetching user data from Authentik...');
      authentikUser = await fetchAuthentikUser(identifier);
      
      if (!authentikUser) {
        console.log('❌ User not found in Authentik');
        console.log('ℹ️  Make sure the user exists in Authentik first');
        process.exit(1);
      }
      
      console.log('✅ Found user in Authentik:');
      console.table([{
        email: authentikUser.email,
        username: authentikUser.username,
        name: authentikUser.name,
        user_id: authentikUser.id.substring(0, 20) + '...'
      }]);
    }
    
    switch (command) {
      case 'find':
        if (!existingUser) {
          console.log('\n❌ User profile not found in database');
          console.log('ℹ️  Try fetching from Authentik with: node user-reset.js sync <email>');
          process.exit(1);
        }
        // Already displayed by findExistingUser
        break;
        
      case 'sync':
        if (!existingUser) {
          console.log('\nℹ️  No existing profile found, will create new profile...');
        }
        await syncUserProfile(authentikUser);
        break;
        
      case 'delete':
        if (!existingUser) {
          console.log('\n❌ No user profile to delete');
          process.exit(1);
        }
        
        if (needsConfirm) {
          console.log('\n⚠️  WARNING: This will permanently delete:');
          console.log('   - User profile');
          console.log('   - Associated company (if owned by user)');
          console.log('   - Related data');
          console.log('\nℹ️  Use --confirm flag to skip this prompt');
          console.log('\nℹ️  Press Ctrl+C to cancel, or press Enter to continue...');
          
          // Wait for user input (simple confirmation)
          await new Promise(resolve => {
            process.stdin.once('data', () => resolve());
          });
        }
        
        await deleteUser(existingUser.user_id);
        break;
        
      case 'recreate':
        if (existingUser) {
          console.log('\n🔄 Step 1: Deleting existing user profile...');
          await deleteUser(existingUser.user_id);
        }
        
        console.log('\n🔄 Step 2: Creating new profile from Authentik...');
        await syncUserProfile(authentikUser);
        break;
    }
    
    console.log('\n✅ Operation completed successfully!');
    
    if (['sync', 'recreate', 'delete'].includes(command)) {
      console.log('\n📋 Next steps:');
      console.log('1. Clear your browser cache/cookies (if this is your account)');
      console.log('2. Log out and log back in through Authentik');
      console.log('3. Verify the changes in the Nexus dashboard');
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Operation failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { 
  syncUserProfile, 
  deleteUser, 
  findExistingUser, 
  fetchAuthentikUser 
};