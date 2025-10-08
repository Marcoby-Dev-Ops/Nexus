import React, { useState, useEffect } from 'react';
import { useAuthentikAuth } from '@/shared/contexts/AuthentikAuthContext';
import { callRPC } from '@/lib/api-client';
import { getEnv } from '@/core/environment';
import { TestSignOut } from '@/shared/components/TestSignOut';

export default function AuthTestPage() {
  const [authStatus, setAuthStatus] = useState<any>(null);
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { user, session, isAuthenticated, signIn, signOut } = useAuthentikAuth();

  const testAuth = async () => {
    setLoading(true);
    try {
      // Test the auth endpoint
      const apiUrl = getEnv().api.url;
      const response = await fetch(`${apiUrl}/api/auth/test`, {
        headers: {
          'Authorization': `Bearer ${session?.accessToken || 'no-token'}`
        }
      });
      const data = await response.json();
      setAuthStatus(data);
    } catch (error) {
      setAuthStatus({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  const testSessionInfo = async () => {
    setLoading(true);
    try {
      const apiUrl = getEnv().api.url;
      const response = await fetch(`${apiUrl}/api/auth/session-info`, {
        headers: {
          'Authorization': `Bearer ${session?.accessToken || 'no-token'}`
        }
      });
      const data = await response.json();
      setSessionInfo(data);
    } catch (error) {
      setSessionInfo({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  const testRPC = async () => {
    setLoading(true);
    try {
      const result = await callRPC('ensure_user_profile', { user_id: user?.id || 'test' });
      console.log('RPC Result:', result);
    } catch (error) {
      console.error('RPC Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Authentication Test Page</h1>
        
        {/* Authentication Status */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Authentication Status</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <strong>Is Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}
            </div>
            <div>
              <strong>User ID:</strong> {user?.id || 'None'}
            </div>
            <div>
              <strong>User Email:</strong> {user?.email || 'None'}
            </div>
            <div>
              <strong>Has Session:</strong> {session ? 'Yes' : 'No'}
            </div>
          </div>
          
          <div className="flex gap-4">
            <button
              onClick={signIn}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Sign In
            </button>
            <button
              onClick={signOut}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* API Tests */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">API Tests</h2>
          <div className="flex gap-4 mb-4">
            <button
              onClick={testAuth}
              disabled={loading}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
            >
              Test Auth Endpoint
            </button>
            <button
              onClick={testSessionInfo}
              disabled={loading}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
            >
              Test Session Info
            </button>
            <button
              onClick={testRPC}
              disabled={loading}
              className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50"
            >
              Test RPC
            </button>
          </div>
          
          {loading && <div className="text-gray-600">Loading...</div>}
        </div>

        {/* Results */}
        {authStatus && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Auth Test Results</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(authStatus, null, 2)}
            </pre>
          </div>
        )}

        {sessionInfo && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Session Info Results</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(sessionInfo, null, 2)}
            </pre>
          </div>
        )}

        {/* Session Details */}
        {session && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Session Details</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(session, null, 2)}
            </pre>
          </div>
        )}

        {/* Test Sign Out Component */}
        <div className="bg-white rounded-lg shadow p-6">
          <TestSignOut />
        </div>
      </div>
    </div>
  );
}
