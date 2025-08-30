// Test current authentication state
console.log('🔍 Testing current authentication state...\n');

// 1. Check if we're in a browser environment
if (typeof window !== 'undefined') {
  console.log('✅ Running in browser environment');
  
  // 2. Check localStorage for session
  console.log('\n1. Checking localStorage...');
  const sessionData = localStorage.getItem('authentik_session');
  console.log('Session data exists:', !!sessionData);
  
  if (sessionData) {
    try {
      const session = JSON.parse(sessionData);
      console.log('Session details:', {
        hasAccessToken: !!session.accessToken,
        accessTokenLength: session.accessToken?.length,
        hasUser: !!session.user,
        userId: session.user?.sub || session.user?.id,
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
      
      // Try to decode the JWT token
      if (session.accessToken) {
        try {
          const parts = session.accessToken.split('.');
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
          console.log('Failed to decode JWT:', error.message);
        }
      }
    } catch (error) {
      console.error('Failed to parse session:', error);
    }
  } else {
    console.log('❌ No session data found in localStorage');
  }
  
  // 3. Test the RPC call
  console.log('\n2. Testing RPC call...');
  async function testRPCCall() {
    try {
      // Import the function
      const { callRPC } = await import('./src/lib/api-client.ts');
      
      // Get the current user ID from the session
      const sessionData = localStorage.getItem('authentik_session');
      if (sessionData) {
        const session = JSON.parse(sessionData);
        const userId = session.user?.sub || session.user?.id;
        
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
  
} else {
  console.log('❌ Not running in browser environment');
}
