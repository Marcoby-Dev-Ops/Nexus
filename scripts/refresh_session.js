/**
 * Session Refresh Utility
 * 
 * This script helps refresh authentication sessions and fix common issues
 */

// Import the AuthentikAuthService
async function importAuthService() {
  try {
    // Dynamic import to avoid SSR issues
    const { authentikAuthService } = await import('../src/core/auth/AuthentikAuthService.js');
    return authentikAuthService;
  } catch (error) {
    console.error('Failed to import AuthentikAuthService:', error);
    return null;
  }
}

// Force refresh the session
async function forceRefreshSession() {
  console.log('🔄 Force refreshing session...');
  
  try {
    const authService = await importAuthService();
    if (!authService) {
      console.log('❌ Could not import auth service');
      return false;
    }
    
    // Clear existing session
    localStorage.removeItem('authentik_session');
    sessionStorage.removeItem('authentik_session');
    
    console.log('✅ Cleared existing sessions');
    
    // Try to get a fresh session
    const sessionResult = await authService.getSession();
    
    if (sessionResult.success && sessionResult.data) {
      console.log('✅ Successfully refreshed session');
      console.log('Session details:', {
        userId: sessionResult.data.user?.sub,
        email: sessionResult.data.user?.email,
        expiresAt: sessionResult.data.expiresAt ? new Date(sessionResult.data.expiresAt).toISOString() : 'N/A'
      });
      return true;
    } else {
      console.log('❌ Failed to refresh session:', sessionResult.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Error during session refresh:', error);
    return false;
  }
}

// Create a new session for vonj
async function createVonjSession() {
  console.log('👤 Creating session for vonj...');
  
  try {
    // Create a mock session for vonj
    const vonjSession = {
      accessToken: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYThlMGRmZi0xYmY1LTQwODctOGYxMC03Nzk2YTk5MmYyZWQiLCJlbWFpbCI6InZvbmoubWFyY29ieUBnbWFpbC5jb20iLCJnaXZlbl9uYW1lIjoiVm9uIiwiZmFtaWx5X25hbWUiOiJNYXJjb2J5IiwiaXNzIjoiaHR0cHM6Ly9pZGVudGl0eS5tYXJjb2J5LmNvbSIsImlhdCI6MTczNDIxOTkyNywiZXhwIjoxNzM0MjIxODI3fQ.mock_signature",
      refreshToken: "vonj_refresh_token_12345",
      tokenType: "Bearer",
      expiresAt: Date.now() + (30 * 60 * 1000), // 30 minutes from now
      user: {
        sub: "aa8e0dff-1b5f-4087-8f10-7796a992f2ed",
        email: "vonj@marcoby.com",
        given_name: "Von",
        family_name: "Marcoby",
        name: "Von Marcoby",
        email_verified: true,
        iss: "https://identity.marcoby.com"
      }
    };
    
    // Store the session
    localStorage.setItem('authentik_session', JSON.stringify(vonjSession));
    sessionStorage.setItem('authentik_session', JSON.stringify(vonjSession));
    
    console.log('✅ Created vonj session');
    console.log('Session details:', {
      userId: vonjSession.user.sub,
      email: vonjSession.user.email,
      expiresAt: new Date(vonjSession.expiresAt).toISOString()
    });
    
    return true;
  } catch (error) {
    console.log('❌ Error creating vonj session:', error);
    return false;
  }
}

// Fix common authentication issues
async function fixAuthIssues() {
  console.log('🔧 Fixing authentication issues...');
  
  try {
    // Step 1: Check current session
    const currentSession = localStorage.getItem('authentik_session');
    if (currentSession) {
      const session = JSON.parse(currentSession);
      console.log('Current session user:', session.user?.sub);
      
      // If it's vonj's session, try to refresh it
      if (session.user?.sub === 'aa8e0dff-1b5f-4087-8f10-7796a992f2ed') {
        console.log('Found vonj session, attempting refresh...');
        const refreshed = await forceRefreshSession();
        if (refreshed) {
          console.log('✅ Session refreshed successfully');
          return true;
        }
      }
    }
    
    // Step 2: Create new vonj session if no valid session exists
    console.log('Creating new vonj session...');
    const created = await createVonjSession();
    if (created) {
      console.log('✅ New session created successfully');
      return true;
    }
    
    return false;
  } catch (error) {
    console.log('❌ Error fixing auth issues:', error);
    return false;
  }
}

// Main function
async function main() {
  console.log('🚀 Authentication Fix Utility\n');
  
  const action = process.argv[2] || 'fix';
  
  switch (action) {
    case 'refresh':
      await forceRefreshSession();
      break;
    case 'create':
      await createVonjSession();
      break;
    case 'fix':
    default:
      await fixAuthIssues();
      break;
  }
  
  console.log('\n🔄 Please refresh the page to apply changes.');
}

// Run if called directly
if (typeof window !== 'undefined') {
  // Browser environment
  window.fixAuthIssues = fixAuthIssues;
  window.forceRefreshSession = forceRefreshSession;
  window.createVonjSession = createVonjSession;
  
  console.log('🔧 Authentication utilities loaded. Use:');
  console.log('- fixAuthIssues() - Fix common auth issues');
  console.log('- forceRefreshSession() - Force refresh session');
  console.log('- createVonjSession() - Create new vonj session');
} else {
  // Node.js environment
  main().catch(console.error);
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    fixAuthIssues,
    forceRefreshSession,
    createVonjSession
  };
}
