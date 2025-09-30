# Authentik Refresh Token Configuration

## Problem
Your Authentik OAuth application is not providing refresh tokens, causing sessions to expire without the ability to refresh them automatically.

## Solution

### 1. Configure Authentik OAuth Application

1. **Log into your Authentik admin panel** at `https://identity.marcoby.com`

2. **Navigate to Applications** → **OAuth2/OpenID Providers**

3. **Find your Nexus application** and click to edit it

4. **Enable Refresh Tokens**:
   - Set **Token validity** to a reasonable duration (e.g., 30 minutes)
   - Enable **Refresh tokens** checkbox
   - Set **Refresh token validity** to a longer duration (e.g., 30 days)

5. **Update Scopes** (if needed):
   - Ensure the application has the `offline_access` scope if you want refresh tokens to work when the user is offline

### 2. Verify Configuration

After updating the OAuth application settings:

1. **Clear existing sessions**:
   ```javascript
   localStorage.removeItem('authentik_session');
   sessionStorage.removeItem('authentik_session');
   ```

2. **Sign out and sign back in** to get a new session with refresh tokens

3. **Check the session** in browser dev tools:
   ```javascript
   const session = JSON.parse(localStorage.getItem('authentik_session'));
   console.log('Has refresh token:', !!session?.refreshToken);
   ```

### 3. Alternative: Temporary Workaround

If you can't immediately configure Authentik, you can extend the access token validity:

1. **Update Authentik application settings**:
   - Increase **Token validity** to a longer duration (e.g., 24 hours)
   - This will reduce the frequency of session expirations

2. **Update client-side configuration** in `src/lib/authentik.ts`:
   ```typescript
   tokenExpiry: import.meta.env.DEV 
     ? 24 * 60 * 60 * 1000  // 24 hours in development
     : 24 * 60 * 60 * 1000, // 24 hours in production (instead of 30 minutes)
   ```

## Expected Behavior After Fix

Once refresh tokens are properly configured:

1. **OAuth callback** will receive both `access_token` and `refresh_token`
2. **Session creation** will include the refresh token
3. **Automatic refresh** will work when tokens are about to expire
4. **No more warnings** about missing refresh tokens

## Testing

To verify the fix is working:

1. Check browser console for the absence of "No refresh token available" warnings
2. Monitor network requests for token refresh calls
3. Verify sessions persist across browser restarts
4. Test automatic token refresh by waiting for tokens to approach expiration

## Troubleshooting

If refresh tokens still don't work after configuration:

1. **Check Authentik logs** for OAuth errors
2. **Verify OAuth application settings** are saved correctly
3. **Test with a new OAuth application** to isolate the issue
4. **Check browser network tab** for the token exchange response
