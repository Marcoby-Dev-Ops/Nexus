/**
 * Debug Session Refresh Issues
 * 
 * This script helps debug why sessions aren't refreshing automatically.
 * Run this in the browser console to check your current session status.
 */

console.log('🔍 Debugging Session Refresh Issues...\n');

// Check current session
function checkCurrentSession() {
  console.log('📋 Current Session Status:');
  
  const sessionData = localStorage.getItem('authentik_session');
  if (!sessionData) {
    console.log('❌ No session found in localStorage');
    return null;
  }

  try {
    const session = JSON.parse(sessionData);
    const now = Date.now();
    const expiresAt = session.expiresAt;
    const timeUntilExpiry = expiresAt - now;
    const minutesUntilExpiry = Math.floor(timeUntilExpiry / (1000 * 60));
    
    console.log('✅ Session found:', {
      userId: session.user?.sub,
      email: session.user?.email,
      hasRefreshToken: !!session.refreshToken,
      expiresAt: new Date(expiresAt).toISOString(),
      timeUntilExpiry: `${minutesUntilExpiry} minutes`,
      isExpired: timeUntilExpiry <= 0,
      needsRefresh: timeUntilExpiry <= 5 * 60 * 1000 // 5 minutes
    });

    return session;
  } catch (error) {
    console.log('❌ Error parsing session:', error);
    return null;
  }
}

// Check if refresh timer is running
function checkRefreshTimer() {
  console.log('\n⏰ Refresh Timer Status:');
  
  // Check if there are any active timeouts (this is limited in browser)
  console.log('ℹ️  Note: Browser security prevents checking active timeouts');
  console.log('💡 The refresh timer should be running every 60 seconds');
  console.log('💡 Check browser console for refresh-related logs');
}

// Test manual refresh
async function testManualRefresh() {
  console.log('\n🔄 Testing Manual Refresh:');
  
  try {
    // Import the auth service
    const { authentikAuthService } = await import('../src/core/auth/AuthentikAuthService.ts');
    
    const sessionResult = await authentikAuthService.getSession();
    if (sessionResult.success && sessionResult.data) {
      console.log('✅ Manual refresh successful');
      console.log('Session details:', {
        userId: sessionResult.data.user?.id,
        email: sessionResult.data.user?.email,
        expiresAt: sessionResult.data.expiresAt ? new Date(sessionResult.data.expiresAt).toISOString() : 'N/A'
      });
    } else {
      console.log('❌ Manual refresh failed:', sessionResult.error);
    }
  } catch (error) {
    console.log('❌ Error testing manual refresh:', error);
  }
}

// Check browser console for errors
function checkConsoleErrors() {
  console.log('\n🚨 Console Error Check:');
  console.log('💡 Look for these error patterns in the console:');
  console.log('   - "Token refresh failed"');
  console.log('   - "Automatic token refresh failed"');
  console.log('   - "Session expired"');
  console.log('   - "No refresh token available"');
}

// Main debug function
async function debugSession() {
  console.log('='.repeat(50));
  console.log('🔍 SESSION REFRESH DEBUG REPORT');
  console.log('='.repeat(50));
  
  const session = checkCurrentSession();
  checkRefreshTimer();
  await testManualRefresh();
  checkConsoleErrors();
  
  console.log('\n' + '='.repeat(50));
  console.log('📝 RECOMMENDATIONS:');
  console.log('='.repeat(50));
  
  if (!session) {
    console.log('1. 🔑 Log in again to create a new session');
  } else if (session.refreshToken) {
    console.log('1. ✅ Session has refresh token - should auto-refresh');
    console.log('2. 🔍 Check browser console for refresh logs');
    console.log('3. ⏰ Wait for automatic refresh (every 60 seconds)');
  } else {
    console.log('1. ⚠️  Session missing refresh token - will expire');
    console.log('2. 🔧 Check Authentik OAuth2 provider settings');
    console.log('3. 🔑 May need to re-authenticate');
  }
  
  console.log('\n4. 🛠️  If issues persist, check:');
  console.log('   - Authentik server logs');
  console.log('   - Network tab for failed refresh requests');
  console.log('   - OAuth2 provider configuration');
}

// Run the debug
debugSession();
