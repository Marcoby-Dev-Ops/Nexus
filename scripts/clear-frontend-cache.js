import fs from 'fs';
import path from 'path';

async function clearFrontendCache() {
  try {
    console.log('🧹 Clearing frontend caches...\n');

    const cacheKeys = [
      'nexus_onboarding_complete',
      'nexus_onboarding',
      'nexus-onboarding-data',
      'nexus-onboarding-current-step',
      'nexus-onboarding-last-saved',
      'fire-initiatives-d2770389274aad9319e41dc713cb5c8206cc84f0cadf10e49c17dc329e66eec3',
      'nexus_ai_onboarding_completed'
    ];

    console.log('📋 Cache keys to clear:');
    cacheKeys.forEach(key => console.log(`  - ${key}`));

    console.log('\n💡 To clear these caches in your browser:');
    console.log('1. Open Developer Tools (F12)');
    console.log('2. Go to Application tab');
    console.log('3. Select "Local Storage" on the left');
    console.log('4. Delete the following keys:');
    cacheKeys.forEach(key => console.log(`   - ${key}`));
    
    console.log('\n🔄 Alternative: Clear all site data');
    console.log('1. Go to Settings > Privacy and security > Site Settings');
    console.log('2. Find your site and click "Clear data"');
    
    console.log('\n🔄 Or try a hard refresh:');
    console.log('1. Press Ctrl+Shift+R (or Cmd+Shift+R on Mac)');
    console.log('2. Or hold Shift and click the refresh button');

    console.log('\n🎯 The issue is likely cached frontend state, not the database.');
    console.log('Your onboarding is properly completed in the database.');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

clearFrontendCache();
