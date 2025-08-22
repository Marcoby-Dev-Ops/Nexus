// Debug frontend authentication
console.log('🔍 Debugging frontend authentication...\n');

// 1. Check what's in localStorage
console.log('1. Checking localStorage...');
const sessionData = localStorage.getItem('authentik_session');
console.log('Session data:', sessionData);

if (sessionData) {
  try {
    const session = JSON.parse(sessionData);
    console.log('Parsed session:', {
      hasAccessToken: !!session.accessToken,
      accessTokenLength: session.accessToken?.length,
      hasRefreshToken: !!session.refreshToken,
      refreshTokenLength: session.refreshToken?.length,
      user: session.user,
      expiresAt: session.expiresAt,
      createdAt: session.createdAt
    });
    
    // Check if token is expired
    if (session.expiresAt) {
      const now = Date.now();
      const expiresAt = new Date(session.expiresAt).getTime();
      const isExpired = now > expiresAt;
      console.log('Token expiration:', {
        now: new Date(now).toISOString(),
        expiresAt: new Date(expiresAt).toISOString(),
        isExpired,
        timeUntilExpiry: expiresAt - now
      });
    }
  } catch (error) {
    console.error('Failed to parse session data:', error);
  }
}

// 2. Test the getAuthHeaders function
console.log('\n2. Testing getAuthHeaders function...');
async function testGetAuthHeaders() {
  try {
    // Import the function
    const { getAuthHeaders } = await import('./src/lib/api-client.ts');
    const headers = await getAuthHeaders();
    console.log('Auth headers:', {
      hasAuthorization: !!headers.Authorization,
      authorizationLength: headers.Authorization?.length,
      contentType: headers['Content-Type']
    });
    
    if (headers.Authorization) {
      const token = headers.Authorization.replace('Bearer ', '');
      console.log('Token preview:', token.substring(0, 50) + '...');
      
      // Try to decode the JWT payload
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          console.log('JWT payload:', {
            sub: payload.sub,
            iss: payload.iss,
            aud: payload.aud,
            exp: payload.exp ? new Date(payload.exp * 1000).toISOString() : null,
            iat: payload.iat ? new Date(payload.iat * 1000).toISOString() : null
          });
        }
      } catch (error) {
        console.log('Failed to decode JWT payload:', error.message);
      }
    }
  } catch (error) {
    console.error('Failed to test getAuthHeaders:', error);
  }
}

testGetAuthHeaders();

// 3. Test the RPC call directly
console.log('\n3. Testing RPC call directly...');
async function testRPCCall() {
  try {
    const { callRPC } = await import('./src/lib/api-client.ts');
    
    // Get the current user ID from the session
    const sessionData = localStorage.getItem('authentik_session');
    if (sessionData) {
      const session = JSON.parse(sessionData);
      const userId = session.user?.id;
      
      if (userId) {
        console.log('Testing RPC call with user ID:', userId);
        const result = await callRPC('ensure_user_profile', { external_user_id: userId });
        console.log('RPC result:', result);
      } else {
        console.log('No user ID found in session');
      }
    } else {
      console.log('No session data found');
    }
  } catch (error) {
    console.error('Failed to test RPC call:', error);
  }
}

testRPCCall();
