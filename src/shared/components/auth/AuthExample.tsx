import React from 'react';
import { useAuth, useOptionalUserContext } from '@/shared/hooks/useAuth';

/**
 * Example component showing how to use the simplified auth system
 * This follows the NextAuth.js pattern for clean, simple auth
 */
export const AuthExample: React.FC = () => {
  const { user, profile, company, isAuthenticated, loading, error } = useAuthContext();

  if (loading) {
    return <div>Loading authentication...</div>;
  }

  if (error) {
    return <div>Authentication error: {error.message}</div>;
  }

  if (!isAuthenticated) {
    return <div>Please sign in to continue</div>;
  }

  return (
    <div>
      <h2>Welcome, {profile?.display_name || user?.email?.split('@')[0] || 'User'}!</h2>
      <p>Email: {user?.email}</p>
      <p>Role: {profile?.role || 'No role assigned'}</p>
      {company && (
        <p>Company: {company.name}</p>
      )}
    </div>
  );
};

/**
 * Example component showing how to use the user context hook
 * This throws an error if user context is not available
 */
export const UserContextExample: React.FC = () => {
  const { user, session, profile, isValid } = useOptionalUserContext();
  
  if (!isValid) {
    return <div>User context not available</div>;
  }
  
  return (
    <div>
      <h3>User Context (Guaranteed)</h3>
      <p>User ID: {user?.id}</p>
      <p>Profile: {profile?.display_name}</p>
      <p>Session Active: {session ? 'Yes' : 'No'}</p>
    </div>
  );
};

/**
 * Example component showing how to use the optional user context hook
 * This doesn't throw and returns what's available
 */
export const OptionalUserContextExample: React.FC = () => {
  const { user, session, profile, isValid } = useOptionalUserContext();
  
  if (!isValid) {
    return <div>User context not available</div>;
  }
  
  return (
    <div>
      <h3>Optional User Context</h3>
      <p>User ID: {user?.id}</p>
      <p>Profile: {profile?.display_name}</p>
      <p>Session Active: {session ? 'Yes' : 'No'}</p>
    </div>
  );
};

/**
 * Example component showing authentication actions
 */
export const AuthActionsExample: React.FC = () => {
  const { signIn, signOut, isAuthenticated } = useAuthContext();
  
  const handleSignIn = async () => {
    const result = await signIn('test@example.com', 'password');
    if (!result.success) {
      console.error('Sign in failed:', result.error);
    }
  };
  
  const handleSignOut = async () => {
    const result = await signOut();
    if (!result.success) {
      console.error('Sign out failed:', result.error);
    }
  };
  
  return (
    <div>
      <h3>Authentication Actions</h3>
      {isAuthenticated ? (
        <button onClick={handleSignOut}>Sign Out</button>
      ) : (
        <button onClick={handleSignIn}>Sign In</button>
      )}
    </div>
  );
}; 