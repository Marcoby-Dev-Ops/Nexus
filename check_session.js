// Check current session in localStorage
if (typeof window !== 'undefined') {
  const sessionData = localStorage.getItem('authentik_session');
  if (sessionData) {
    try {
      const session = JSON.parse(sessionData);
      console.log('Current session:', {
        hasAccessToken: !!session.accessToken,
        hasRefreshToken: !!session.refreshToken,
        hasSession: !!session.session,
        accessTokenLength: session.accessToken?.length || 0,
        refreshTokenLength: session.refreshToken?.length || 0,
        sessionAccessToken: session.session?.accessToken?.length || 0,
        sessionRefreshToken: session.session?.refreshToken?.length || 0,
        expiresAt: session.expiresAt ? new Date(session.expiresAt).toISOString() : null
      });
      
      // Check if access token is expired
      if (session.accessToken || session.session?.accessToken) {
        const token = session.accessToken || session.session?.accessToken;
        try {
          const parts = token.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1]));
            const now = Math.floor(Date.now() / 1000);
            console.log('Token status:', {
              exp: new Date(payload.exp * 1000).toISOString(),
              now: new Date().toISOString(),
              expired: payload.exp < now,
              timeUntilExpiry: payload.exp - now
            });
          }
        } catch (e) {
          console.log('Error parsing token:', e.message);
        }
      }
    } catch (error) {
      console.error('Error parsing session:', error);
    }
  } else {
    console.log('No session found in localStorage');
  }
} else {
  console.log('This script must be run in a browser environment');
}
