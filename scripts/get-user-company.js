#!/usr/bin/env node

/**
 * Script to get the current user's company ID
 * Usage: node scripts/get-user-company.js [user_id]
 */

import 'dotenv/config';
import { query } from '../server/src/database/connection.js';
import { logger } from '../server/src/utils/logger.js';

async function getUserCompany(userId) {
  try {
    logger.info('Getting user company information', { userId });

    // Get user profile with company information
    const sql = `
      SELECT 
        up.user_id,
        up.email,
        up.first_name,
        up.last_name,
        up.company_id,
        c.name as company_name,
        c.industry as company_industry,
        c.domain as company_domain
      FROM user_profiles up
      LEFT JOIN companies c ON up.company_id = c.id
      WHERE up.user_id = $1
    `;

    const result = await query(sql, [userId]);

    if (result.error) {
      throw new Error(`Database error: ${result.error}`);
    }

    if (!result.data || result.data.length === 0) {
      logger.warn('No user profile found', { userId });
      return {
        success: false,
        error: 'User profile not found'
      };
    }

    const userProfile = result.data[0];
    
    logger.info('User company information retrieved', {
      userId: userProfile.user_id,
      email: userProfile.email,
      companyId: userProfile.company_id,
      companyName: userProfile.company_name
    });

    return {
      success: true,
      user: {
        id: userProfile.user_id,
        email: userProfile.email,
        name: `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim(),
        companyId: userProfile.company_id,
        companyName: userProfile.company_name,
        companyIndustry: userProfile.company_industry,
        companyDomain: userProfile.company_domain
      }
    };

  } catch (error) {
    logger.error('Failed to get user company', { userId, error: error.message });
    return {
      success: false,
      error: error.message
    };
  }
}

async function main() {
  const userId = process.argv[2];
  
  if (!userId) {
    console.log('Usage: node scripts/get-user-company.js <user_id>');
    console.log('');
    console.log('To find your user ID, you can:');
    console.log('1. Check your browser\'s developer tools for the JWT token');
    console.log('2. Look at the server logs when you authenticate');
    console.log('3. Use the auth test endpoint: GET /api/auth/test');
    process.exit(1);
  }

  console.log(`Getting company information for user: ${userId}`);
  console.log('');

  const result = await getUserCompany(userId);

  if (result.success) {
    console.log('✅ User Company Information:');
    console.log('');
    console.log(`User ID: ${result.user.id}`);
    console.log(`Email: ${result.user.email}`);
    console.log(`Name: ${result.user.name || 'Not set'}`);
    console.log('');
    console.log(`Company ID: ${result.user.companyId || 'Not connected to a company'}`);
    console.log(`Company Name: ${result.user.companyName || 'N/A'}`);
    console.log(`Company Industry: ${result.user.companyIndustry || 'N/A'}`);
    console.log(`Company Domain: ${result.user.companyDomain || 'N/A'}`);
    
    if (!result.user.companyId) {
      console.log('');
      console.log('⚠️  This user is not connected to any company.');
      console.log('   You may need to complete onboarding or create a company.');
    }
  } else {
    console.log('❌ Failed to get user company information:');
    console.log(`   Error: ${result.error}`);
    process.exit(1);
  }
}

// Run the script
main().catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});
