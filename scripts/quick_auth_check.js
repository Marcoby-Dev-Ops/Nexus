/**
 * Quick Authentication Check
 * 
 * Run this in your browser console to diagnose auth issues
 */

console.log('🔍 Quick Authentication Check for vonj...\n');

// Check localStorage session
const sessionData = localStorage.getItem('authentik_session');
if (!sessionData) {
  console.log('❌ No session found in localStorage');
  console.log('💡 SOLUTION: You need to log in again');
} else {
  try {
    const session = JSON.parse(sessionData);
    console.log('✅ Session found:', {
      userId: session.user?.sub,
      email: session.user?.email,
      hasAccessToken: !!session.accessToken,
      hasRefreshToken: !!session.refreshToken,
      expiresAt: session.expiresAt ? new Date(session.expiresAt).toISOString() : 'N/A',
      isExpired: session.expiresAt ? Date.now() >= session.expiresAt : 'Unknown'
    });

    // Check if it's vonj's session
    if (session.user?.sub === 'aa8e0dff-1b5f-4087-8f10-7796a992f2ed') {
      console.log('✅ This is vonj\'s session');
    } else {
      console.log('❌ This is NOT vonj\'s session');
      console.log('💡 SOLUTION: Clear session and log in as vonj');
    }

    // Check token expiration
    if (session.expiresAt && Date.now() >= session.expiresAt) {
      console.log('❌ Token is expired');
      console.log('💡 SOLUTION: Refresh the page or log in again');
    } else {
      console.log('✅ Token is still valid');
    }

  } catch (error) {
    console.log('❌ Error parsing session:', error);
    console.log('💡 SOLUTION: Clear localStorage and log in again');
  }
}

// Check server connectivity
console.log('\n🔍 Checking server connectivity...');
fetch('http://localhost:3001/api/db/test')
  .then(response => response.json())
  .then(result => {
    if (result.success) {
      console.log('✅ Server is reachable');
    } else {
      console.log('❌ Server returned error:', result.error);
    }
  })
  .catch(error => {
    console.log('❌ Server connectivity failed:', error.message);
    console.log('💡 SOLUTION: Make sure the server is running on port 3001');
  });

// Check user mapping
console.log('\n🔍 Checking user mapping...');
const currentSession = localStorage.getItem('authentik_session');
if (currentSession) {
  const session = JSON.parse(currentSession);
  if (session.user?.sub) {
    fetch('http://localhost:3001/api/rpc/test/get_user_profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_id: session.user.sub })
    })
    .then(response => response.json())
    .then(result => {
      if (result.success && result.data && result.data.length > 0) {
        console.log('✅ User mapping found:', {
          profileId: result.data[0].id,
          userId: result.data[0].user_id,
          email: result.data[0].email,
          name: `${result.data[0].first_name} ${result.data[0].last_name}`
        });
      } else {
        console.log('❌ No user profile found');
        console.log('💡 SOLUTION: User mapping issue - contact support');
      }
    })
    .catch(error => {
      console.log('❌ Error checking user mapping:', error.message);
    });
  }
}

// Quick fix function
window.fixVonjSession = function() {
  console.log('🔧 Creating new vonj session...');
  
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
  
  localStorage.setItem('authentik_session', JSON.stringify(vonjSession));
  console.log('✅ New vonj session created');
  console.log('🔄 Refreshing page...');
  location.reload();
};

console.log('\n💡 QUICK FIX: Run fixVonjSession() to create a new session');
