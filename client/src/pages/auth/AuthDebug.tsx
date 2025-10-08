import React from 'react';
import { useAuth } from '@/hooks/useAuth';

export default function AuthDebug() {
  const { user, session, loading, initialized, error, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Authentication Debug</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Auth State */}
          <div className="bg-card border rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-4">Auth State</h2>
            <div className="space-y-2 text-sm">
              <div><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</div>
              <div><strong>Initialized:</strong> {initialized ? 'Yes' : 'No'}</div>
              <div><strong>Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}</div>
              <div><strong>Error:</strong> {error ? error.message : 'None'}</div>
            </div>
          </div>

          {/* User Info */}
          <div className="bg-card border rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-4">User Info</h2>
            {user ? (
              <div className="space-y-2 text-sm">
                <div><strong>ID:</strong> {user.id}</div>
                <div><strong>Email:</strong> {user.email}</div>
                <div><strong>Name:</strong> {user.name || 'N/A'}</div>
                <div><strong>First Name:</strong> {user.firstName || 'N/A'}</div>
                <div><strong>Last Name:</strong> {user.lastName || 'N/A'}</div>
              </div>
            ) : (
              <p className="text-muted-foreground">No user data</p>
            )}
          </div>

          {/* Session Info */}
          <div className="bg-card border rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-4">Session Info</h2>
            {session ? (
              <div className="space-y-2 text-sm">
                <div><strong>Has Access Token:</strong> {session.session?.accessToken ? 'Yes' : 'No'}</div>
                <div><strong>Has Refresh Token:</strong> {session.session?.refreshToken ? 'Yes' : 'No'}</div>
                <div><strong>Expires At:</strong> {session.session?.expiresAt || 'N/A'}</div>
                <div><strong>Is Expired:</strong> {
                  session.session?.expiresAt ? 
                    (new Date(session.session.expiresAt) <= new Date() ? 'Yes' : 'No') : 
                    'Unknown'
                }</div>
              </div>
            ) : (
              <p className="text-muted-foreground">No session data</p>
            )}
          </div>

          {/* Local Storage */}
          <div className="bg-card border rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-4">Local Storage</h2>
            <div className="space-y-2 text-sm">
              <div><strong>authentik_session:</strong> {localStorage.getItem('authentik_session') ? 'Present' : 'Not found'}</div>
              <div><strong>authentik_oauth_state:</strong> {localStorage.getItem('authentik_oauth_state') ? 'Present' : 'Not found'}</div>
              <div><strong>authentik_code_verifier:</strong> {localStorage.getItem('authentik_code_verifier') ? 'Present' : 'Not found'}</div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 bg-card border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">Actions</h2>
          <div className="flex gap-4">
            <button
              onClick={() => {
                localStorage.removeItem('authentik_session');
                localStorage.removeItem('authentik_oauth_state');
                localStorage.removeItem('authentik_code_verifier');
                window.location.reload();
              }}
              className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90"
            >
              Clear All Auth Data
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
