# Authentik OAuth2 Provider Configuration for Nexus

## Overview
This document provides step-by-step instructions for configuring the OAuth2/OIDC provider for the Nexus application in Authentik.

## Prerequisites
- ✅ Authentik instance: https://identity.marcoby.com
- ✅ Nexus application created
- ✅ User account (vonj@marcoby.com) with admin privileges
- ✅ Groups configured (Nexus Admins, Nexus Users)

## OAuth2 Provider Configuration

### Step 1: Create OAuth2/OpenID Provider

1. **Log into Authentik** at https://identity.marcoby.com
2. **Navigate to**: Applications → Providers
3. **Click**: "Create" → "OAuth2/OpenID Provider"

### Step 2: Provider Settings

#### Basic Configuration
- **Name**: `Nexus OAuth2 Provider`
- **Authentication flow**: `default-authentication-flow`
- **Authorization flow**: `default-provider-authorization-explicit-consent`
- **Property mappings**: `default-oauth2-mapping`

#### OAuth2 Settings
- **Client type**: `Confidential`
- **Client ID**: `nexus-client` (or auto-generated)
- **Client Secret**: Auto-generated (save this securely)
- **Redirect URIs**: 
  ```
  http://localhost:5173/auth/callback
  https://nexus.marcoby.com/auth/callback
  ```

#### Scopes
- **Scopes**: 
  - `openid`
  - `profile`
  - `email`
  - `groups`

#### Advanced Settings
- **Signing key**: `default` (or create a new one)
- **Access token validity**: `30 minutes`
- **Refresh token validity**: `30 days`
- **Include in authorization code**: `Yes`
- **Include in refresh token**: `Yes`

### Step 3: Link Provider to Application

1. **Navigate to**: Applications → Applications
2. **Click on**: "Nexus" application
3. **Edit the application**
4. **Set Provider**: Select the "Nexus OAuth2 Provider" you just created
5. **Save**

### Step 4: Configure Launch URL

- **Launch URL**: `https://nexus.marcoby.com` (or `http://localhost:5173` for development)
- **Open in new tab**: `No`

## Client Configuration

### OAuth2 Endpoints

Once configured, your OAuth2 endpoints will be:

```
Authorization URL: https://identity.marcoby.com/application/o/authorize/
Token URL: https://identity.marcoby.com/application/o/token/
User Info URL: https://identity.marcoby.com/application/o/userinfo/
JWKS URL: https://identity.marcoby.com/application/o/jwks/
```

### Client Credentials

After setup, you'll receive:
- **Client ID**: (from provider configuration)
- **Client Secret**: (save securely)
- **Redirect URI**: Your application's callback URL

## Application Integration

### Frontend Configuration

For your Nexus frontend, you'll need to configure:

```javascript
// OAuth2 Configuration
const oauthConfig = {
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  redirectUri: 'https://nexus.marcoby.com/auth/callback', // Production
  // redirectUri: 'http://localhost:5173/auth/callback', // Development
  authorizationUrl: 'https://identity.marcoby.com/application/o/authorize/',
  tokenUrl: 'https://identity.marcoby.com/application/o/token/',
  userInfoUrl: 'https://identity.marcoby.com/application/o/userinfo/',
  scopes: ['openid', 'profile', 'email', 'groups']
};
```

### Backend Configuration

For your Nexus backend, configure JWT validation:

```javascript
// JWT Configuration
const jwtConfig = {
  issuer: 'https://identity.marcoby.com',
  audience: 'your-client-id',
  jwksUrl: 'https://identity.marcoby.com/application/o/jwks/',
  algorithms: ['RS256']
};
```

## Testing Configuration

### 1. Test OAuth Flow
1. Navigate to your Nexus application (http://localhost:5173 or https://nexus.marcoby.com)
2. Click "Login" or "Sign In"
3. Should redirect to Authentik login page
4. Login with vonj@marcoby.com
5. Should redirect back to Nexus with authorization code
6. Verify user information is received

### 2. Test JWT Tokens
1. Complete OAuth flow
2. Extract JWT token from response
3. Decode and verify token contents
4. Check user groups and permissions

### 3. Test Group Permissions
1. Login with vonj@marcoby.com
2. Verify user is in "Nexus Admins" group
3. Check that admin privileges are working

## Security Considerations

### Token Security
- Store client secret securely
- Use HTTPS for all OAuth endpoints
- Validate JWT tokens on every request
- Implement proper token refresh logic

### Redirect URI Security
- Use exact redirect URIs (no wildcards)
- Validate redirect URIs on server side
- Use state parameter to prevent CSRF attacks

### Scope Security
- Request minimum required scopes
- Validate scopes on backend
- Implement proper authorization checks

## Troubleshooting

### Common Issues

1. **Invalid Redirect URI**
   - Ensure redirect URI matches exactly
   - Check for trailing slashes
   - Verify protocol (http vs https)

2. **Invalid Client ID/Secret**
   - Verify client credentials
   - Check for typos
   - Ensure client is active

3. **JWT Validation Errors**
   - Verify issuer URL
   - Check audience claim
   - Validate signing algorithm

4. **Group Permissions Not Working**
   - Verify user is in correct groups
   - Check group membership in JWT
   - Validate group claims in backend

### Debug Steps

1. **Check Authentik Logs**
   - Monitor authentication events
   - Check for error messages
   - Verify user sessions

2. **Test OAuth Endpoints**
   - Use curl or Postman to test endpoints
   - Verify response formats
   - Check error responses

3. **Validate JWT Tokens**
   - Use jwt.io to decode tokens
   - Verify claims and signatures
   - Check expiration times

## Next Steps

After OAuth configuration is complete:

1. **Update Nexus Application Code**
   - Implement OAuth2 authentication flow
   - Add JWT validation middleware
   - Update user session management

2. **Database Migration**
   - Add Authentik user ID mapping
   - Update user profile sync
   - Migrate existing user data

3. **Testing & Validation**
   - Test complete authentication flow
   - Verify user permissions
   - Test group-based access control

4. **Production Deployment**
   - Update production URLs
   - Configure SSL certificates
   - Set up monitoring and logging
