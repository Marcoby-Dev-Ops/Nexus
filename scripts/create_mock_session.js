/**
 * Create Mock Authentik Session
 * 
 * This script creates a mock Authentik session for testing purposes.
 * It simulates a successful OAuth authentication flow.
 */

// Mock session data for the existing user
const mockSession = {
  accessToken: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkZGNjODY2Zi0zM2Y4LTRlZWUtOTFlOS1iMzZhNDVmYTRhOGIiLCJlbWFpbCI6InVzZXJAbmV4dXMubG9jYWwiLCJnaXZlbl9uYW1lIjoiVXNlciIsImZhbWlseV9uYW1lIjoiTmV4dXMiLCJpc3MiOiJodHRwczovL2lkZW50aXR5Lm1hcmNvYnkuY29tIiwiaWF0IjoxNzM0MjE5OTI3LCJleHAiOjE3MzQyMjE4Mjd9.mock_signature",
  refreshToken: "mock_refresh_token_12345",
  tokenType: "Bearer",
  expiresAt: Math.floor(Date.now() / 1000) + 1800, // 30 minutes from now
  user: {
    sub: "ddcc866f-33f8-4eee-91e9-b36a45fa4a8b",
    email: "user@nexus.local",
    given_name: "User",
    family_name: "Nexus",
    name: "User Nexus",
    email_verified: true,
    iss: "https://identity.marcoby.com"
  }
};

// Store the session in localStorage
if (typeof window !== 'undefined') {
  try {
    localStorage.setItem('authentik_session', JSON.stringify(mockSession));
    console.log('✅ Mock Authentik session created successfully!');
    console.log('Session data:', {
      userId: mockSession.user.sub,
      email: mockSession.user.email,
      expiresAt: new Date(mockSession.expiresAt * 1000).toISOString()
    });
    
    // Also store in sessionStorage for redundancy
    sessionStorage.setItem('authentik_session', JSON.stringify(mockSession));
    
    console.log('🔄 Please refresh the page to apply the session.');
  } catch (error) {
    console.error('❌ Failed to create mock session:', error);
  }
} else {
  console.log('This script must be run in a browser environment.');
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { mockSession };
}
