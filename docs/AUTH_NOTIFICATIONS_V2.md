# Auth & Notifications v2

## Overview

The authentication and notification systems have been completely refactored to follow modern React patterns and provide a seamless developer experience. This document outlines the new architecture and how to use these systems.

## Authentication System

### Architecture

The authentication system is built around a single `useAuth` hook and follows the **NextAuth.js pattern** - clean, predictable, and easy to use.

#### Core Components

1. **`useAuth` Hook** (`src/hooks/useAuth.ts`)
   - Single source of truth for authentication state
   - Provides user, session, loading states, and auth methods
   - Automatic session management with Supabase

2. **Route Guards** (`src/app/App.tsx`)
   - `ProtectedRoute` - redirects unauthenticated users to login
   - `PublicRoute` - redirects authenticated users to dashboard
   - `RootRoute` - shows landing page or redirects to dashboard

3. **Auth Service** (`src/services/auth.ts`)
   - Abstracts Supabase auth operations
   - Provides consistent error handling
   - Centralized auth logic

#### Usage

```typescript
import { useAuth } from '@/hooks/useAuth';

function MyComponent() {
  const { 
    user, 
    session, 
    isAuthenticated, 
    loading,
    signIn, 
    signOut 
  } = useAuth();

  if (loading) return <LoadingSpinner />;
  
  return (
    <div>
      {isAuthenticated ? (
        <p>Welcome, {user?.email}!</p>
      ) : (
        <LoginForm onSignIn={signIn} />
      )}
    </div>
  );
}
```

#### Route Protection

```typescript
// In App.tsx
<Route 
  path="/dashboard" 
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  } 
/>
```

### Observability

The auth system includes comprehensive logging:

- **Development**: Console logs for auth events
- **Production**: Ready for integration with logging services
- **Events tracked**: Sign in/out, session changes, errors

## Notification System

### Architecture

The notification system provides a unified way to display toast notifications and manage notification state across the application.

#### Core Components

1. **`NotificationProvider`** (`src/shared/hooks/NotificationContext.tsx`)
   - Manages notification state
   - Auto-dismiss functionality
   - Read/unread tracking

2. **`useNotifications` Hook**
   - Provides notification methods
   - Type-safe notification creation
   - Automatic state management

#### Usage

```typescript
import { useNotifications } from '@/shared/hooks/NotificationContext';

function MyComponent() {
  const { addNotification } = useNotifications();

  const handleSuccess = () => {
    addNotification({
      type: 'success',
      title: 'Success!',
      message: 'Operation completed successfully'
    });
  };

  const handleError = () => {
    addNotification({
      type: 'error',
      title: 'Error',
      message: 'Something went wrong'
    });
  };

  return (
    <div>
      <button onClick={handleSuccess}>Show Success</button>
      <button onClick={handleError}>Show Error</button>
    </div>
  );
}
```

#### Notification Types

- `success` - Green, auto-dismisses in 5 seconds
- `error` - Red, auto-dismisses in 10 seconds
- `warning` - Yellow, auto-dismisses in 10 seconds
- `info` - Blue, auto-dismisses in 10 seconds

### Observability

The notification system includes event logging:

- **Development**: Console logs for notification events
- **Production**: Ready for integration with analytics
- **Events tracked**: Add, remove, read status changes

## Provider Setup

Both systems are integrated at the application root:

```typescript
// src/app/main.tsx
root.render(
  <React.StrictMode>
    <RootErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Router>
          <ThemeProvider defaultTheme="system">
            <NotificationProvider>
              <ToastProvider>
                <App />
              </ToastProvider>
            </NotificationProvider>
          </ThemeProvider>
        </Router>
      </QueryClientProvider>
    </RootErrorBoundary>
  </React.StrictMode>
);
```

## Migration Guide

### From Old Auth System

1. **Replace custom auth hooks** with `useAuth`
2. **Update route guards** to use `ProtectedRoute`/`PublicRoute`
3. **Remove direct Supabase auth calls** - use `authService` instead
4. **Update error handling** to use the new error patterns

### From Old Notification System

1. **Replace toast libraries** with `useNotifications`
2. **Update notification calls** to use the new API
3. **Remove custom notification state** - use the provider
4. **Update notification styling** to match the new design system

## Best Practices

### Authentication

1. **Always check loading state** before rendering auth-dependent content
2. **Use route guards** instead of conditional rendering
3. **Handle auth errors gracefully** with user-friendly messages
4. **Log auth events** for debugging and analytics

### Notifications

1. **Use appropriate notification types** for different scenarios
2. **Keep messages concise** and actionable
3. **Don't spam notifications** - use them sparingly
4. **Test notification flows** in different scenarios

## Testing

### Auth Tests

```bash
pnpm test --testPathPattern="auth"
```

### Notification Tests

```bash
pnpm test --testPathPattern="notification"
```

### Manual Testing

1. **Login flow**: Sign in → refresh → access protected route
2. **Notification flow**: Trigger success/error notifications
3. **Session persistence**: Verify auth state survives page reloads
4. **Error handling**: Test with network issues and invalid credentials

## Troubleshooting

### Common Issues

1. **Auth not working**: Check Supabase configuration and network
2. **Notifications not showing**: Verify provider is mounted correctly
3. **Route guards not working**: Check component hierarchy and imports
4. **Session not persisting**: Verify Supabase session storage

### Debug Mode

Enable debug logging by setting `NODE_ENV=development`:

```bash
# Auth events will be logged to console
# Notification events will be logged to console
```

## Future Enhancements

1. **RBAC Integration**: Use the new permission system with auth
2. **Advanced Notifications**: Add notification categories and preferences
3. **Offline Support**: Handle auth state during network issues
4. **Analytics Integration**: Track auth and notification usage patterns 