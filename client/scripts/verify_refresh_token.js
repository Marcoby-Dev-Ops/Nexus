// Verify refresh token fix
console.log('🔍 Verifying refresh token fix...\n');

// Check if we're in a browser environment
if (typeof window === 'undefined') {
  console.log('❌ This script must be run in a browser console');
  console.log('📋 Copy and paste this code into your browser console:');
  console.log('');
  console.log('const sessionData = localStorage.getItem("authentik_session");');
  console.log('if (sessionData) {');
  console.log('  const session = JSON.parse(sessionData);');
  console.log('  console.log("✅ Session found");');
  console.log('  console.log("Has refresh token:", !!session.refreshToken);');
  console.log('  console.log("Refresh token length:", session.refreshToken?.length || 0);');
  console.log('  console.log("Access token length:", session.accessToken?.length || 0);');
  console.log('  console.log("Expires at:", new Date(session.expiresAt).toISOString());');
  console.log('  console.log("Time until expiry:", new Date(session.expiresAt).getTime() - Date.now(), "ms");');
  console.log('} else {');
  console.log('  console.log("❌ No session found - please sign in first");');
  console.log('}');
  process.exit(1);
}

// Browser environment code
const sessionData = localStorage.getItem('authentik_session');

if (sessionData) {
  try {
    const session = JSON.parse(sessionData);
    
    console.log('✅ Session found');
    console.log('Has refresh token:', !!session.refreshToken);
    console.log('Refresh token length:', session.refreshToken?.length || 0);
    console.log('Access token length:', session.accessToken?.length || 0);
    console.log('Expires at:', new Date(session.expiresAt).toISOString());
    console.log('Time until expiry:', new Date(session.expiresAt).getTime() - Date.now(), 'ms');
    
    if (session.refreshToken) {
      console.log('\n🎉 SUCCESS: Refresh token is now being saved!');
      console.log('Your authentication should now persist across browser restarts.');
    } else {
      console.log('\n⚠️  WARNING: Still no refresh token found');
      console.log('This might mean:');
      console.log('1. You need to sign out and sign back in');
      console.log('2. The Authentik OAuth app needs refresh tokens enabled');
      console.log('3. There was an issue with the token exchange');
    }
  } catch (error) {
    console.error('❌ Failed to parse session data:', error);
  }
} else {
  console.log('❌ No session found - please sign in first');
  console.log('After signing in, run this script again to verify refresh tokens');
}
