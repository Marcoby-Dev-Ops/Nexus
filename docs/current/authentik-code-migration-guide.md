# Authentik Code Migration Guide

## Overview
This guide provides step-by-step instructions for migrating your Nexus application from Supabase authentication to Authentik OAuth2.

## Prerequisites
- ✅ Authentik OAuth provider configured
- ✅ Client ID and Client Secret obtained
- ✅ OAuth endpoints configured

## Migration Steps

### 1. Environment Configuration

Update your `.env` file with Authentik credentials:

```bash
# Replace these placeholder values with your actual Authentik credentials
VITE_AUTHENTIK_CLIENT_ID=your-actual-client-id
VITE_AUTHENTIK_CLIENT_SECRET=your-actual-client-secret
VITE_AUTHENTIK_BASE_URL=https://identity.marcoby.com
```

### 2. Update Authentication Context

Replace the existing Supabase AuthContext with Authentik:

**Before (Supabase):**
```typescript
// src/shared/contexts/AuthContext.tsx
import { supabase } from '@/lib/supabase';
import { authService } from '@/core/auth';

// Use Supabase auth methods
const { signIn, signOut } = useAuth();
```

**After (Authentik):**
```typescript
// src/shared/contexts/AuthentikAuthContext.tsx
import { authentikAuthService } from '@/core/auth/AuthentikAuthService';

// Use Authentik auth methods
const { signIn, signOut } = useAuthentikAuth();
```

### 3. Update App.tsx

Replace the AuthProvider in your main App component:

**Before:**
```typescript
import { AuthProvider } from '@/shared/contexts/AuthContext';

function App() {
  return (
    <AuthProvider>
      {/* Your app content */}
    </AuthProvider>
  );
}
```

**After:**
```typescript
import { AuthentikAuthProvider } from '@/shared/contexts/AuthentikAuthContext';

function App() {
  return (
    <AuthentikAuthProvider>
      {/* Your app content */}
    </AuthentikAuthProvider>
  );
}
```

### 4. Update Login Components

Update your login components to use OAuth flow instead of email/password:

**Before (Email/Password):**
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  const { error } = await signIn(email, password);
  if (!error) {
    navigate('/dashboard');
  }
};
```

**After (OAuth):**
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  const { error } = await signIn(); // No parameters needed
  if (!error) {
    // User will be redirected to Authentik login page
    // No need to navigate manually
  }
};
```

### 5. Update Route Configuration

Update your route configuration to use the new callback component:

**Before:**
```typescript
import AuthCallback from '@/pages/admin/AuthCallback';

<Route path="/auth/callback" element={<AuthCallback />} />
```

**After:**
```typescript
import AuthentikAuthCallback from '@/pages/admin/AuthentikAuthCallback';

<Route path="/auth/callback" element={<AuthentikAuthCallback />} />
```

### 6. Update Hooks Usage

Update your custom hooks to use the new Authentik auth context:

**Before:**
```typescript
import { useAuth } from '@/hooks/useAuth';

function MyComponent() {
  const { user, signIn, signOut } = useAuth();
  // ...
}
```

**After:**
```typescript
import { useAuthentikAuth } from '@/shared/contexts/AuthentikAuthContext';

function MyComponent() {
  const { user, signIn, signOut } = useAuthentikAuth();
  // ...
}
```

### 7. Update API Calls

Update your API calls to use Authentik tokens instead of Supabase tokens:

**Before:**
```typescript
import { supabase } from '@/lib/supabase';

const { data: { session } } = await supabase.auth.getSession();
const token = session?.access_token;

// Use token in API calls
const response = await fetch('/api/data', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

**After:**
```typescript
import { authentikAuthService } from '@/core/auth/AuthentikAuthService';

const sessionResult = await authentikAuthService.getSession();
const token = sessionResult.data?.session.accessToken;

// Use token in API calls
const response = await fetch('/api/data', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### 8. Update Protected Routes

Update your route protection logic:

**Before:**
```typescript
import { useAuth } from '@/hooks/useAuth';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" />;
  
  return <>{children}</>;
}
```

**After:**
```typescript
import { useAuthentikAuth } from '@/shared/contexts/AuthentikAuthContext';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isAuthenticated } = useAuthentikAuth();
  
  if (loading) return <LoadingSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" />;
  
  return <>{children}</>;
}
```

### 9. Update User Profile Components

Update components that display user information:

**Before:**
```typescript
const { user } = useAuth();

return (
  <div>
    <p>Welcome, {user?.email}!</p>
    <p>Name: {user?.firstName} {user?.lastName}</p>
  </div>
);
```

**After:**
```typescript
const { user } = useAuthentikAuth();

return (
  <div>
    <p>Welcome, {user?.email}!</p>
    <p>Name: {user?.firstName} {user?.lastName}</p>
    {user?.groups && (
      <p>Groups: {user.groups.join(', ')}</p>
    )}
  </div>
);
```

### 10. Update Database Schema

Add Authentik user ID mapping to your database:

```sql
-- Add Authentik user ID column to user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN authentik_user_id TEXT;

-- Create index for performance
CREATE INDEX idx_user_profiles_authentik_user_id 
ON public.user_profiles(authentik_user_id);

-- Add unique constraint
ALTER TABLE public.user_profiles 
ADD CONSTRAINT unique_authentik_user_id 
UNIQUE (authentik_user_id);
```

### 11. Update User Profile Sync

Create a function to sync Authentik user data with your database:

```typescript
// src/core/auth/userProfileSync.ts
import { supabase } from '@/lib/supabase';
import { authentikAuthService } from '@/core/auth/AuthentikAuthService';

export async function syncUserProfile() {
  try {
    const sessionResult = await authentikAuthService.getSession();
    if (!sessionResult.success || !sessionResult.data) {
      throw new Error('No active session');
    }

    const authUser = sessionResult.data.user;
    
    // Upsert user profile
    const { error } = await supabase
      .from('user_profiles')
      .upsert({
        id: authUser.id, // Use Authentik user ID
        authentik_user_id: authUser.id,
        email: authUser.email,
        first_name: authUser.firstName,
        last_name: authUser.lastName,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'authentik_user_id'
      });

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to sync user profile:', error);
    return { success: false, error };
  }
}
```

### 12. Update API Middleware

Update your API middleware to validate Authentik tokens:

```typescript
// src/core/middleware/authMiddleware.ts
import { authentikAuthService } from '@/core/auth/AuthentikAuthService';

export async function validateAuthentikToken(token: string) {
  try {
    const result = await authentikAuthService.validateToken(token);
    return result.success && result.data;
  } catch (error) {
    console.error('Token validation failed:', error);
    return false;
  }
}
```

## Testing the Migration

### 1. Test OAuth Flow
1. Start your development server
2. Navigate to the login page
3. Click "Sign In" - should redirect to Authentik
4. Login with vonj@marcoby.com
5. Should redirect back to your app with successful authentication

### 2. Test Session Management
1. Login successfully
2. Refresh the page - should maintain session
3. Check browser storage for Authentik session data
4. Test automatic token refresh

### 3. Test Protected Routes
1. Try accessing protected routes without authentication
2. Should redirect to login page
3. After login, should allow access to protected routes

### 4. Test User Profile Sync
1. Login with Authentik user
2. Check if user profile is created/updated in database
3. Verify Authentik user ID mapping

## Rollback Plan

If you need to rollback to Supabase auth:

1. **Revert AuthContext**: Switch back to `AuthContext` from `AuthentikAuthContext`
2. **Revert Login Flow**: Restore email/password login components
3. **Revert API Calls**: Switch back to Supabase token usage
4. **Update Environment**: Remove Authentik variables, restore Supabase variables

## Troubleshooting

### Common Issues

1. **OAuth Redirect URI Mismatch**
   - Ensure redirect URI in Authentik matches your app's callback URL
   - Check for trailing slashes and protocol differences

2. **Invalid Client Credentials**
   - Verify Client ID and Client Secret are correct
   - Check that the OAuth provider is active in Authentik

3. **Token Validation Errors**
   - Ensure JWT validation is properly configured
   - Check that the issuer and audience match your Authentik configuration

4. **Session Not Persisting**
   - Check localStorage for session data
   - Verify token refresh logic is working
   - Check for CORS issues with Authentik endpoints

### Debug Steps

1. **Check Browser Console**
   - Look for OAuth-related errors
   - Check network requests to Authentik endpoints

2. **Check Authentik Logs**
   - Monitor authentication events in Authentik admin
   - Check for failed authentication attempts

3. **Test OAuth Endpoints**
   - Use curl or Postman to test OAuth endpoints directly
   - Verify token exchange is working

## Next Steps

After completing the migration:

1. **Remove Supabase Auth Dependencies**
   - Remove unused Supabase auth imports
   - Clean up old auth-related code

2. **Update Documentation**
   - Update API documentation to reflect new authentication
   - Update user guides for new login flow

3. **Monitor and Optimize**
   - Monitor authentication performance
   - Optimize token refresh logic
   - Add error tracking for auth failures

4. **Security Review**
   - Review OAuth configuration security
   - Ensure proper token validation
   - Test for common OAuth vulnerabilities
