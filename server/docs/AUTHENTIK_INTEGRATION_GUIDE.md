# Authentik Frontend Integration Guide

## Overview
Your Nexus frontend is now configured to authenticate users through your existing Authentik OAuth2 provider using a simple, lightweight authentication service that connects to your server-side OAuth infrastructure. No external OAuth libraries required!

## Setup Steps

### 1. Configure Environment Variables ✅ COMPLETED

Your environment variables are already properly configured:

**Server `.env`:**
```bash
AUTHENTIK_CLIENT_ID=v6FYo8pTUpSsFRKAoyyOugzA8mMH4H9UupzHffXs
AUTHENTIK_CLIENT_SECRET=gXrNdkAxniLt2XhTAFIl0Dd2iSaC0gdeDsDAIikOy1tYjFOESu4RmhLFXYKJMWCuUjhrxoeHGhXxMIGjbcXyqN0o90gz8Ail8MM2jKTXD2nHFnIYSelU1EbNCdlEJHzo
AUTHENTIK_BASE_URL=https://identity.marcoby.com
```

**Client `.env`:**
```bash
VITE_AUTHENTIK_CLIENT_ID=v6FYo8pTUpSsFRKAoyyOugzA8mMH4H9UupzHffXs
VITE_AUTHENTIK_BASE_URL=https://identity.marcoby.com
```

### 2. Update Your App Component ✅ COMPLETED

Your App component has been updated with the AuthProvider and authentication routes:

```tsx
// src/App.tsx
import { AuthProvider, ProtectedRoute } from './components/auth/AuthProvider';
import AuthLoginPage from './pages/AuthLoginPage';
import AuthCallbackPage from './pages/AuthCallbackPage';

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="nexus-ui-theme">
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public routes */}
            <Route path="/auth/login" element={<AuthLoginPage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            
            {/* Protected routes */}
            <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
            <Route path="/identity" element={<ProtectedRoute><IdentityPage /></ProtectedRoute>} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}
```

### 3. Use Authentication in Components ✅ COMPLETED

Your HomePage has been updated to show user information and logout functionality:

```tsx
import { useAuth } from './components/auth/AuthProvider';

function HomePage() {
  const { user, logout } = useAuth();

  return (
    <div>
      {/* User info in header */}
      {user && (
        <div className="flex items-center gap-2">
          <Avatar>
            <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
          </Avatar>
          <span>{user.name || user.email}</span>
        </div>
      )}
      
      {/* Logout button */}
      <Button onClick={logout}>
        <LogOut className="h-4 w-4" />
        Logout
      </Button>
    </div>
  );
}
```

## How It Works

1. **User clicks login** → Redirected to Authentik OAuth2 authorization endpoint
2. **User authenticates** → Redirected back to `/auth/callback`
3. **Callback handler** → Exchanges authorization code for tokens via your server's `/api/oauth/token` endpoint
4. **User info fetched** → Gets user details via your server's `/api/oauth/userinfo` endpoint
5. **Session created** → User can access protected routes with automatic token refresh

## Files Created

- `src/lib/auth/authentik-auth.ts` - Core authentication service
- `src/lib/hooks/useAuthentikAuth.ts` - React hook for auth state
- `src/components/auth/AuthProvider.tsx` - Context provider
- `src/components/auth/LoginButton.tsx` - Login UI component
- `src/pages/AuthLoginPage.tsx` - Login page
- `src/pages/AuthCallbackPage.tsx` - OAuth callback handler

## Next Steps

1. Get your actual Authentik client ID from your Authentik admin panel
2. Update the environment variables
3. Test the authentication flow
4. Integrate the AuthProvider into your main App component
5. Protect your routes with the ProtectedRoute component

## Troubleshooting

- **CORS errors**: Make sure your Authentik redirect URI matches exactly
- **Token validation fails**: Check that your server's AUTHENTIK_CLIENT_SECRET is correct
- **User not found**: Ensure the user exists in your Authentik instance

Your server-side OAuth infrastructure is already properly configured - this just connects your frontend to it!
