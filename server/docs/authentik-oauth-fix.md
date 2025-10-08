# Authentik OAuth Authentication Fix

## Problem
The Authentik OAuth authentication was failing with a 400 Bad Request error when trying to exchange the authorization code for tokens. The error occurred because:

1. **Client-side token exchange**: The client was trying to exchange the authorization code directly with Authentik
2. **Missing client secret**: The client secret was not available on the client-side (as it should be kept secure)
3. **CORS issues**: Direct token exchange from browser to Authentik can cause CORS problems

## Solution
Implemented server-side token exchange for Authentik OAuth flow:

### 1. Server-side Configuration
- Added Authentik to the `OAUTH_PROVIDERS` configuration in `server/routes/oauth.js`
- Added `AUTHENTIK_CLIENT_SECRET` environment variable for server-side use
- Updated token exchange endpoint to handle Authentik's response format

### 2. Client-side Updates
- Modified `AuthentikAuthService.handleOAuthCallback()` to use server-side endpoint
- Added `refreshTokenServerSide()` method for token refresh
- Updated `getSession()` to use server-side refresh

### 3. Environment Variables
Added to `env.example`:
```bash
AUTHENTIK_CLIENT_SECRET=your_authentik_client_secret_here
```

## Files Modified

### Server-side
- `server/routes/oauth.js` - Added Authentik provider configuration
- `env.example` - Added AUTHENTIK_CLIENT_SECRET

### Client-side
- `src/core/auth/AuthentikAuthService.ts` - Updated to use server-side endpoints
- `src/lib/authentik.ts` - Kept for user info and session management

## Testing
Created `scripts/test-oauth-config.js` to verify:
- Environment variables are set correctly
- Authentik endpoints are accessible
- Server endpoints are working

## Usage
1. Set the `AUTHENTIK_CLIENT_SECRET` in your `.env.local` file
2. Ensure your Authentik application is configured with the correct redirect URI
3. Test the OAuth flow

## Security Benefits
- Client secret is kept server-side only
- Reduced CORS issues
- Better error handling and logging
- Consistent with other OAuth providers in the system

## Next Steps
1. Test the OAuth flow end-to-end
2. Monitor logs for any remaining issues
3. Consider adding rate limiting to the OAuth endpoints
4. Add comprehensive error handling for edge cases
