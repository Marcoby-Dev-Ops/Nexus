# Modern Authentication System

## Overview

The Nexus authentication system has been completely rebuilt to follow modern React patterns and provide a seamless user experience. This new system is simple, reliable, and follows real-world best practices.

## Key Features

### ✅ **Simple & Clean**
- Single `AuthProvider` component
- Simple `useAuth()` hook
- No complex state management
- Clear, predictable API

### ✅ **Reliable**
- Automatic session management
- Proper error handling
- Seamless redirects
- No timing issues

### ✅ **Modern UX**
- Loading states
- Error messages
- Smooth transitions
- Mobile-friendly

### ✅ **Developer Friendly**
- TypeScript support
- Clear documentation
- Easy to extend
- Familiar patterns

## Core Components

### 1. AuthProvider (`src/core/auth/AuthProvider.tsx`)
The main authentication provider that manages all auth state:

```typescript
import { AuthProvider } from '@/core/auth/AuthProvider';

function App() {
  return (
    <AuthProvider>
      {/* Your app components */}
    </AuthProvider>
  );
}
```

### 2. useAuth Hook
Simple hook for accessing authentication state and methods:

```typescript
import { useAuth } from '@/core/auth/AuthProvider';

function MyComponent() {
  const { 
    user, 
    session, 
    isAuthenticated, 
    loading,
    signIn, 
    signOut 
  } = useAuth();

  // Use auth state and methods
}
```

### 3. ProtectedRoute Component
Protects routes that require authentication:

```typescript
import { ProtectedRoute } from '@/shared/components/ProtectedRoute';

<Route 
  path="/dashboard" 
  element={
    <ProtectedRoute>
      <DashboardPage />
    </ProtectedRoute>
  } 
/>
```

## Authentication Flow

### 1. **Initial Load**
- AuthProvider initializes
- Checks for existing session
- Sets loading state
- Updates auth state

### 2. **Sign In**
- User enters credentials
- `signIn()` method called
- Supabase authenticates
- Session stored automatically
- User redirected to dashboard

### 3. **Session Management**
- Automatic token refresh
- Session persistence
- Auth state synchronization
- Proper cleanup on sign out

### 4. **Password Reset**
- User requests reset
- Email sent with secure link
- User clicks link
- Redirected to reset page
- Password updated
- User signed in automatically

## Usage Examples

### Basic Authentication Check
```typescript
function Header() {
  const { user, isAuthenticated, signOut } = useAuth();

  if (!isAuthenticated) {
    return <LoginButton />;
  }

  return (
    <div>
      <span>Welcome, {user?.name}</span>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
```

### Protected Component
```typescript
function UserProfile() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>{user?.name}</h1>
      <p>{user?.email}</p>
    </div>
  );
}
```

### Database Operations
```typescript
import { DatabaseService } from '@/core/database/DatabaseService';

async function updateProfile() {
  try {
    const profile = await DatabaseService.updateUserProfile(userId, {
      full_name: 'John Doe'
    });
    // Profile updated successfully
  } catch (error) {
    // Handle error
  }
}
```

## Configuration

### Environment Variables
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### Supabase Dashboard Settings
1. **Site URL**: `http://localhost:5173` (development)
2. **Redirect URLs**:
   - `http://localhost:5173/auth/callback`
   - `http://localhost:5173/reset-password`

## Migration Guide

### From Old System
1. **Replace old auth hooks**:
   ```typescript
   // Old
   const { user } = useAuthContext();
   
   // New
   const { user } = useAuth();
   ```

2. **Update protected routes**:
   ```typescript
   // Old
   <Route path="/dashboard" element={<DashboardPage />} />
   
   // New
   <Route 
     path="/dashboard" 
     element={
       <ProtectedRoute>
         <DashboardPage />
       </ProtectedRoute>
     } 
   />
   ```

3. **Update database calls**:
   ```typescript
   // Old
   const { data } = await supabase.from('table').select();
   
   // New
   const data = await DatabaseService.query('table');
   ```

## Best Practices

### 1. **Always Use ProtectedRoute**
Wrap any component that requires authentication:

```typescript
<ProtectedRoute>
  <YourComponent />
</ProtectedRoute>
```

### 2. **Handle Loading States**
Always check loading state before rendering:

```typescript
const { loading, user } = useAuth();

if (loading) {
  return <LoadingSpinner />;
}
```

### 3. **Use DatabaseService**
For database operations, use the DatabaseService instead of direct Supabase calls:

```typescript
// Good
const profile = await DatabaseService.getUserProfile(userId);

// Avoid
const { data } = await supabase.from('user_profiles').select();
```

### 4. **Error Handling**
Always handle authentication errors gracefully:

```typescript
const handleSignIn = async () => {
  const result = await signIn(email, password);
  if (result.error) {
    setError(result.error);
  }
};
```

## Troubleshooting

### Common Issues

1. **"No session available"**
   - Check if user is signed in
   - Verify Supabase configuration
   - Check browser console for errors

2. **Redirect loops**
   - Ensure ProtectedRoute is used correctly
   - Check route configuration
   - Verify auth state

3. **Database permission errors**
   - Use DatabaseService instead of direct calls
   - Check RLS policies
   - Verify user authentication

### Debug Mode
Enable debug logging in development:

```typescript
// In AuthProvider.tsx
console.log('Auth state changed:', event, session?.user?.email);
```

## Security Features

- **Automatic session refresh**
- **Secure token storage**
- **CSRF protection**
- **RLS policy enforcement**
- **Proper error handling**

This new authentication system provides a solid foundation for secure, user-friendly authentication that scales with your application. 