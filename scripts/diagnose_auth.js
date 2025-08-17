/**
 * Authentication Diagnostic Script
 * 
 * This script helps diagnose authentication issues by checking:
 * - Session storage
 * - Token validity
 * - User mappings
 * - Server connectivity
 */

// Check localStorage session
function checkLocalStorage() {
  console.log('🔍 Checking localStorage...');
  
  try {
    const sessionData = localStorage.getItem('authentik_session');
    if (!sessionData) {
      console.log('❌ No session found in localStorage');
      return null;
    }
    
    const session = JSON.parse(sessionData);
    console.log('✅ Session found in localStorage:', {
      hasAccessToken: !!session.accessToken,
      hasRefreshToken: !!session.refreshToken,
      hasUser: !!session.user,
      userId: session.user?.sub,
      expiresAt: session.expiresAt ? new Date(session.expiresAt).toISOString() : 'N/A',
      isExpired: session.expiresAt ? Date.now() >= session.expiresAt : 'Unknown'
    });
    
    return session;
  } catch (error) {
    console.log('❌ Error parsing session from localStorage:', error);
    return null;
  }
}

// Check sessionStorage
function checkSessionStorage() {
  console.log('🔍 Checking sessionStorage...');
  
  try {
    const sessionData = sessionStorage.getItem('authentik_session');
    if (!sessionData) {
      console.log('❌ No session found in sessionStorage');
      return null;
    }
    
    const session = JSON.parse(sessionData);
    console.log('✅ Session found in sessionStorage:', {
      hasAccessToken: !!session.accessToken,
      hasUser: !!session.user,
      userId: session.user?.sub
    });
    
    return session;
  } catch (error) {
    console.log('❌ Error parsing session from sessionStorage:', error);
    return null;
  }
}

// Check token validity
function checkTokenValidity(session) {
  if (!session?.accessToken) {
    console.log('❌ No access token to validate');
    return false;
  }
  
  console.log('🔍 Checking token validity...');
  
  try {
    const parts = session.accessToken.split('.');
    if (parts.length !== 3) {
      console.log('❌ Invalid token format');
      return false;
    }
    
    const payload = JSON.parse(atob(parts[1]));
    const now = Date.now() / 1000;
    
    console.log('✅ Token details:', {
      issuer: payload.iss,
      audience: payload.aud,
      subject: payload.sub,
      issuedAt: new Date(payload.iat * 1000).toISOString(),
      expiresAt: new Date(payload.exp * 1000).toISOString(),
      isExpired: payload.exp < now,
      timeUntilExpiry: Math.floor((payload.exp - now) / 60) + ' minutes'
    });
    
    return payload.exp > now;
  } catch (error) {
    console.log('❌ Error validating token:', error);
    return false;
  }
}

// Check server connectivity
async function checkServerConnectivity() {
  console.log('🔍 Checking server connectivity...');
  
  try {
    const response = await fetch('http://localhost:3001/api/db/test');
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Server is reachable');
      return true;
    } else {
      console.log('❌ Server returned error:', result.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Server connectivity failed:', error.message);
    return false;
  }
}

// Check user mapping
async function checkUserMapping(session) {
  if (!session?.user?.sub) {
    console.log('❌ No user ID to check mapping');
    return false;
  }
  
  console.log('🔍 Checking user mapping...');
  
  try {
    const response = await fetch(`http://localhost:3001/api/rpc/test/get_user_profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_id: session.user.sub })
    });
    
    const result = await response.json();
    
    if (result.success) {
      if (result.data && result.data.length > 0) {
        console.log('✅ User mapping found:', {
          profileId: result.data[0].id,
          userId: result.data[0].user_id,
          email: result.data[0].email,
          name: `${result.data[0].first_name} ${result.data[0].last_name}`
        });
        return true;
      } else {
        console.log('❌ No user profile found');
        return false;
      }
    } else {
      console.log('❌ User mapping check failed:', result.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Error checking user mapping:', error.message);
    return false;
  }
}

// Main diagnostic function
async function runDiagnostics() {
  console.log('🚀 Starting authentication diagnostics...\n');
  
  // Check localStorage
  const localStorageSession = checkLocalStorage();
  console.log('');
  
  // Check sessionStorage
  const sessionStorageSession = checkSessionStorage();
  console.log('');
  
  // Use the best available session
  const session = localStorageSession || sessionStorageSession;
  
  if (session) {
    // Check token validity
    const tokenValid = checkTokenValidity(session);
    console.log('');
    
    // Check server connectivity
    const serverReachable = await checkServerConnectivity();
    console.log('');
    
    // Check user mapping
    const mappingExists = await checkUserMapping(session);
    console.log('');
    
    // Summary
    console.log('📊 DIAGNOSTIC SUMMARY:');
    console.log(`- Session in localStorage: ${localStorageSession ? '✅' : '❌'}`);
    console.log(`- Session in sessionStorage: ${sessionStorageSession ? '✅' : '❌'}`);
    console.log(`- Token valid: ${tokenValid ? '✅' : '❌'}`);
    console.log(`- Server reachable: ${serverReachable ? '✅' : '❌'}`);
    console.log(`- User mapping exists: ${mappingExists ? '✅' : '❌'}`);
    
    if (!tokenValid) {
      console.log('\n🔧 RECOMMENDATION: Token is expired. Try refreshing the page or logging in again.');
    } else if (!serverReachable) {
      console.log('\n🔧 RECOMMENDATION: Server is not reachable. Check if the server is running.');
    } else if (!mappingExists) {
      console.log('\n🔧 RECOMMENDATION: User mapping is missing. This may cause authentication issues.');
    } else {
      console.log('\n✅ All checks passed. Authentication should be working.');
    }
  } else {
    console.log('❌ No valid session found. You need to log in.');
  }
}

// Run diagnostics if in browser
if (typeof window !== 'undefined') {
  runDiagnostics();
} else {
  console.log('This script must be run in a browser environment.');
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    checkLocalStorage,
    checkSessionStorage,
    checkTokenValidity,
    checkServerConnectivity,
    checkUserMapping,
    runDiagnostics
  };
}
