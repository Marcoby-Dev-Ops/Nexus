/**
 * Auth Debug Panel
 * Component for debugging and testing the unified authentication system
 */

import React, { useState } from 'react';
import { useUnifiedAuth } from '@/domains/hooks/useUnifiedAuth';
import { supabaseDebugService } from '@/shared/services/supabaseDebugService';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { Alert } from '@/shared/components/ui/Alert';

export const AuthDebugPanel: React.FC = () => {
  const auth = useUnifiedAuth();
  const [debugReport, setDebugReport] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [testEmail, setTestEmail] = useState('test@nexus.com');
  const [testPassword, setTestPassword] = useState('password123');

  const runDebugReport = async () => {
    setLoading(true);
    try {
      const report = await supabaseDebugService.generateDebugReport();
      setDebugReport(report);
    } catch (error) {
      setDebugReport(`Error generating report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    setLoading(false);
  };

  const testSignUp = async () => {
    setLoading(true);
    try {
      const result = await auth.signUp(testEmail, testPassword);
      if (result.success) {
        console.log('Test user signed up successfully');
        setDebugReport(`✅ Test signup successful! Check your email for confirmation.`);
      } else {
        console.error('Failed to sign up test user:', result.error);
        setDebugReport(`❌ Signup failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Error signing up test user:', error);
      setDebugReport(`❌ Signup error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    setLoading(false);
  };

  const testSignIn = async () => {
    setLoading(true);
    try {
      const result = await auth.signIn(testEmail, testPassword);
      if (result.success) {
        console.log('Test user signed in successfully');
        setDebugReport(`✅ Test signin successful!`);
      } else {
        console.error('Failed to sign in test user:', result.error);
        setDebugReport(`❌ Signin failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Error signing in test user:', error);
      setDebugReport(`❌ Signin error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    setLoading(false);
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await auth.signOut();
      setDebugReport(`✅ Signed out successfully`);
    } catch (error) {
      console.error('Error signing out:', error);
      setDebugReport(`❌ Sign out error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    setLoading(false);
  };

  return (
    <Card className="p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">🔧 Authentication Debug Panel</h3>
        
        {/* Current Auth State */}
        <div className="space-y-4">
          <div>
            <strong>Status:</strong> {auth.isAuthenticated ? '✅ Authenticated' : '❌ Not Authenticated'}
          </div>
          
          {auth.user && (
            <div className="space-y-2">
              <div><strong>User ID:</strong> {auth.user.id}</div>
              <div><strong>Email:</strong> {auth.user.email}</div>
              <div><strong>Name:</strong> {auth.user.name || 'Not set'}</div>
              <div><strong>Role:</strong> {auth.user.role || 'Not set'}</div>
              <div><strong>Department:</strong> {auth.user.department || 'Not set'}</div>
            </div>
          )}
          
          {auth.isLoading && <div>🔄 Loading...</div>}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-4">
        <h4 className="font-medium">Quick Actions:</h4>
        
        <div className="space-y-2">
          {/* Test Credentials Input */}
          <div className="grid grid-cols-2 gap-2">
            <input
              type="email"
              placeholder="Test email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="px-4 py-1 border rounded text-sm"
              disabled={loading}
            />
            <input
              type="password"
              placeholder="Test password"
              value={testPassword}
              onChange={(e) => setTestPassword(e.target.value)}
              className="px-4 py-1 border rounded text-sm"
              disabled={loading}
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={testSignUp}
              disabled={loading || auth.isAuthenticated}
              variant="secondary"
              size="sm"
            >
              {loading ? '⏳' : '📧'} Test Sign Up
            </Button>
            
            <Button 
              onClick={testSignIn}
              disabled={loading || auth.isAuthenticated}
              variant="secondary"
              size="sm"
            >
              {loading ? '⏳' : '🔑'} Test Sign In
            </Button>
          
          <Button 
            onClick={runDebugReport}
            disabled={loading}
            variant="secondary"
            size="sm"
          >
            {loading ? '⏳' : '🔍'} Run Debug Report
          </Button>
          
          {auth.isAuthenticated && (
            <Button 
              onClick={signOut}
              disabled={loading}
              variant="secondary"
              size="sm"
            >
              {loading ? '⏳' : '🚪'} Sign Out
            </Button>
          )}
          </div>
        </div>
      </div>

      {/* Debug Report */}
      {debugReport && (
        <div>
          <h4 className="font-medium mb-2">Debug Report:</h4>
          <pre className="bg-muted dark:bg-background p-4 rounded text-xs overflow-auto max-h-96">
            {debugReport}
          </pre>
        </div>
      )}

      {/* Instructions */}
      <Alert>
        <div className="space-y-2">
          <p className="font-medium">🎯 To Fix Your Conversations 406 Error:</p>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Use "Test Sign Up" to create a new Supabase user account</li>
            <li>Check your email and confirm the account</li>
            <li>Use "Test Sign In" to authenticate with Supabase</li>
            <li>Run "Debug Report" to verify authentication is working</li>
            <li>Once authenticated, conversations will be linked to your account</li>
          </ol>
          <p className="text-xs text-muted-foreground mt-2">
            💡 The unified auth service automatically creates user profiles and links conversations to your Supabase account.
          </p>
        </div>
      </Alert>
    </Card>
  );
}; 