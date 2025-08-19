# Microsoft 365 Token Refresh System

## Overview

The Microsoft 365 integration has been updated to use MSAL's built-in token refresh capabilities instead of manually managing refresh tokens. This provides better security and reliability.

## Key Changes

### 1. Removed Unreliable Refresh Token Extraction

- **Before**: Attempted to extract refresh tokens from MSAL's internal storage
- **After**: Uses MSAL's built-in `acquireTokenSilent()` method for automatic token refresh

### 2. Updated Token Service

- `Microsoft365TokenService` now uses MSAL's silent token acquisition
- Proper error handling when tokens need to be refreshed
- Automatic fallback to re-authentication when refresh fails

### 3. New Hook for Easy Token Access

- `useMicrosoft365Token` hook provides easy access to valid access tokens
- Automatic token refresh when tokens are expired or expiring soon
- Built-in error handling and loading states

## Usage

### Using the Hook

```typescript
import { useMicrosoft365Token } from '@/hooks';

const MyComponent = () => {
  const { accessToken, isLoading, error, isConnected, refreshToken } = useMicrosoft365Token();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!isConnected) {
    return <div>Not connected to Microsoft 365</div>;
  }

  // Use accessToken for API calls
  const makeApiCall = async () => {
    const response = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    // Handle response
  };

  return (
    <div>
      <button onClick={refreshToken}>Refresh Token</button>
      {/* Your component content */}
    </div>
  );
};
```

### Using the Service Directly

```typescript
import { microsoft365Service } from '@/services/integrations/Microsoft365Service';

const getValidToken = async (userId: string) => {
  const result = await microsoft365Service.getValidAccessToken(userId);
  
  if (result.success) {
    return result.data; // Returns the access token string
  } else {
    // Handle error - user may need to reconnect
    console.error('Failed to get valid token:', result.error);
  }
};
```

## How It Works

1. **Initial Authentication**: User authenticates through MSAL with `offline_access` scope
2. **Token Storage**: Access token and expiration are stored in the database
3. **Automatic Refresh**: When a token is needed, the system checks if it's expired
4. **MSAL Silent Acquisition**: If expired, uses MSAL's `acquireTokenSilent()` to get a new token
5. **Database Update**: New token and expiration are updated in the database
6. **Fallback**: If refresh fails, user is prompted to re-authenticate

## Benefits

- **Security**: Refresh tokens are managed securely by MSAL
- **Reliability**: No more unreliable token extraction from storage
- **Simplicity**: Easy-to-use hook for components
- **Automatic**: Token refresh happens transparently
- **Error Handling**: Proper error states and user feedback

## Migration Notes

- Existing connections will continue to work
- No manual refresh token management needed
- Components using the old token service should migrate to the new hook
- The system automatically handles token refresh without user intervention

## Error Handling

When token refresh fails, the system will:

1. Log the error for debugging
2. Return an appropriate error message
3. Prompt the user to reconnect their Microsoft 365 account
4. Clear invalid tokens from the database

This ensures a smooth user experience even when authentication issues occur.
