import React, { useState, useEffect } from 'react';
import { useAuthentikAuth } from '@/shared/contexts/AuthentikAuthContext';
import { authentikAuthService } from '@/core/auth/authentikAuthServiceInstance';
import { Card } from '@/shared/components/ui/Card';

export default function AuthTestPage() {
  const { user, session, loading, isAuthenticated, signIn, signOut } = useAuthentikAuth();
  const [authStatus, setAuthStatus] = useState<any>(null);
  const [testResults, setTestResults] = useState<any>({});

  useEffect(() => {
    // Test authentication status
    const testAuth = async () => {
      const status = await authentikAuthService.getAuthStatus();
      setAuthStatus(status);
    };
    testAuth();
  }, []);

  const runTests = async () => {
    const results: any = {};

    // Test 1: Check if authenticated
    try {
      const isAuth = await authentikAuthService.isAuthenticated();
      results.isAuthenticated = isAuth;
    } catch (error) {
      results.isAuthenticated = { error: error };
    }

    // Test 2: Get session
    try {
      const session = await authentikAuthService.getSession();
      results.getSession = session;
    } catch (error) {
      results.getSession = { error: error };
    }

    // Test 3: Test OAuth flow initiation
    try {
      const oauthFlow = await authentikAuthService.initiateOAuthFlow();
      results.oauthFlow = oauthFlow;
    } catch (error) {
      results.oauthFlow = { error: error };
    }

    setTestResults(results);
  };

  const clearSession = () => {
    localStorage.removeItem('authentik_session');
    localStorage.removeItem('authentik_oauth_state');
    localStorage.removeItem('authentik_code_verifier');
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Authentication System Test</h1>
        
        {/* Current State */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Current Authentication State</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Loading:</strong> {loading ? 'Yes' : 'No'}
            </div>
            <div>
              <strong>Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}
            </div>
            <div>
              <strong>User ID:</strong> {user?.id || 'None'}
            </div>
            <div>
              <strong>User Email:</strong> {user?.email || 'None'}
            </div>
            <div>
              <strong>User Name:</strong> {user?.name || 'None'}
            </div>
            <div>
              <strong>Has Session:</strong> {session ? 'Yes' : 'No'}
            </div>
          </div>
        </Card>

        {/* Environment Variables */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Environment Configuration</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Authentik URL:</strong> {import.meta.env.VITE_AUTHENTIK_URL || 'NOT SET'}
            </div>
            <div>
              <strong>Client ID:</strong> {import.meta.env.VITE_AUTHENTIK_CLIENT_ID ? 'SET' : 'NOT SET'}
            </div>
            <div>
              <strong>Client ID Length:</strong> {(import.meta.env.VITE_AUTHENTIK_CLIENT_ID || '').length}
            </div>
            <div>
              <strong>Redirect URI:</strong> {`${window.location.origin}/auth/callback`}
            </div>
          </div>
        </Card>

        {/* Auth Service Status */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Auth Service Status</h2>
          <pre className="bg-muted p-4 rounded text-xs overflow-auto">
            {JSON.stringify(authStatus, null, 2)}
          </pre>
        </Card>

        {/* Actions */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Actions</h2>
          <div className="flex gap-4 flex-wrap">
            <button
              onClick={runTests}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Run Tests
            </button>
            <button
              onClick={() => signIn()}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Sign In
            </button>
            <button
              onClick={() => signOut()}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Sign Out
            </button>
            <button
              onClick={clearSession}
              className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
            >
              Clear Session
            </button>
          </div>
        </Card>

        {/* Test Results */}
        {Object.keys(testResults).length > 0 && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Test Results</h2>
            <pre className="bg-muted p-4 rounded text-xs overflow-auto">
              {JSON.stringify(testResults, null, 2)}
            </pre>
          </Card>
        )}

        {/* Local Storage */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Local Storage</h2>
          <div className="space-y-2 text-sm">
            <div>
              <strong>authentik_session:</strong> {localStorage.getItem('authentik_session') ? 'Present' : 'Not found'}
            </div>
            <div>
              <strong>authentik_oauth_state:</strong> {localStorage.getItem('authentik_oauth_state') ? 'Present' : 'Not found'}
            </div>
            <div>
              <strong>authentik_code_verifier:</strong> {localStorage.getItem('authentik_code_verifier') ? 'Present' : 'Not found'}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
