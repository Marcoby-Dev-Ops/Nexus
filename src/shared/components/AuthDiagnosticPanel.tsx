import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card.tsx';
import { Button } from '@/shared/components/ui/Button.tsx';
import { Alert, AlertDescription } from '@/shared/components/ui/Alert.tsx';
import { Badge } from '@/shared/components/ui/Badge.tsx';
import { authErrorHandler } from '@/core/services/authErrorHandler';
import { sessionUtils } from '@/lib/supabase';
import { logger } from '@/shared/utils/logger.ts';

interface DiagnosticResult {
  authStatus: any;
  sessionTest: any;
  databaseTest: any;
  rlsTest: any;
  errors: string[];
  recommendations: string[];
}

export const AuthDiagnosticPanel: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<DiagnosticResult | null>(null);
  const [expanded, setExpanded] = useState(false);

  const runDiagnostics = async () => {
    setLoading(true);
    const errors: string[] = [];
    const recommendations: string[] = [];

    try {
      // 1. Check authentication status
      const authStatus = await authErrorHandler.getAuthStatus();
      
      if (!authStatus.hasSession) {
        errors.push('No active session found');
        recommendations.push('User needs to sign in');
      }

      if (authStatus.isExpired) {
        errors.push('Session has expired');
        recommendations.push('Session needs to be refreshed or user needs to sign in again');
      }

      // 2. Test session utilities
      const sessionTest = await sessionUtils.getSession();
      
      if (sessionTest.error) {
        errors.push(`Session test failed: ${sessionTest.error}`);
        recommendations.push('Check session management and authentication flow');
      }

      // 3. Test database connectivity
      const databaseTest = await testDatabaseConnection();
      
      if (databaseTest.error) {
        errors.push(`Database test failed: ${databaseTest.error}`);
        recommendations.push('Check database connection and RLS policies');
      }

      // 4. Test RLS policies
      const rlsTest = await testRLSPolicies();
      
      if (rlsTest.error) {
        errors.push(`RLS test failed: ${rlsTest.error}`);
        recommendations.push('Check Row Level Security policies for affected tables');
      }

      setResults({
        authStatus,
        sessionTest,
        databaseTest,
        rlsTest,
        errors,
        recommendations
      });

    } catch (error) {
      logger.error('Diagnostic run failed', { error });
      setResults({
        authStatus: null,
        sessionTest: null,
        databaseTest: null,
        rlsTest: null,
        errors: ['Diagnostic run failed'],
        recommendations: ['Check console for detailed error information']
      });
    } finally {
      setLoading(false);
    }
  };

  const testDatabaseConnection = async () => {
    try {
      const { supabase } = await import('@/lib/supabase');
      
      // Test basic connection
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id')
        .limit(1);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: 'Database connection failed' };
    }
  };

  const testRLSPolicies = async () => {
    try {
      const { supabase } = await import('@/lib/supabase');
      
      // Test RLS on fire_cycle_logs
      const { data, error } = await supabase
        .from('fire_cycle_logs')
        .select('id')
        .limit(1);

      if (error) {
        return { success: false, error: `RLS test failed: ${error.message}` };
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: 'RLS policy test failed' };
    }
  };

  const refreshSession = async () => {
    try {
      setLoading(true);
      
      // Force session refresh
      const { supabase } = await import('@/lib/supabase');
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        throw error;
      }

      // Re-run diagnostics
      await runDiagnostics();
      
    } catch (error) {
      logger.error('Session refresh failed', { error });
    } finally {
      setLoading(false);
    }
  };

  const clearSession = async () => {
    try {
      setLoading(true);
      
      const { supabase } = await import('@/lib/supabase');
      await supabase.auth.signOut();
      
      // Re-run diagnostics
      await runDiagnostics();
      
    } catch (error) {
      logger.error('Session clear failed', { error });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (expanded) {
      runDiagnostics();
    }
  }, [expanded]);

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>🔍 Authentication Diagnostics</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? 'Hide' : 'Show'} Diagnostics
          </Button>
        </CardTitle>
      </CardHeader>
      
      {expanded && (
        <CardContent className="space-y-4">
          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={runDiagnostics}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              {loading ? 'Running...' : 'Run Diagnostics'}
            </Button>
            <Button
              onClick={refreshSession}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              Refresh Session
            </Button>
            <Button
              onClick={clearSession}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              Clear Session
            </Button>
          </div>

          {/* Results */}
          {results && (
            <div className="space-y-4">
              {/* Authentication Status */}
              <div>
                <h4 className="font-semibold mb-2">Authentication Status</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <Badge variant={results.authStatus?.hasSession ? 'default' : 'destructive'}>
                      Session: {results.authStatus?.hasSession ? 'Active' : 'None'}
                    </Badge>
                  </div>
                  <div>
                    <Badge variant={results.authStatus?.hasUser ? 'default' : 'destructive'}>
                      User: {results.authStatus?.hasUser ? 'Present' : 'Missing'}
                    </Badge>
                  </div>
                  <div>
                    <Badge variant={results.authStatus?.isExpired ? 'destructive' : 'default'}>
                      Expired: {results.authStatus?.isExpired ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  {results.authStatus?.userId && (
                    <div>
                      <Badge variant="outline">
                        ID: {results.authStatus.userId.substring(0, 8)}...
                      </Badge>
                    </div>
                  )}
                </div>
              </div>

              {/* Session Test */}
              <div>
                <h4 className="font-semibold mb-2">Session Test</h4>
                <div className="text-sm">
                  <Badge variant={results.sessionTest?.session ? 'default' : 'destructive'}>
                    {results.sessionTest?.session ? 'Valid' : 'Invalid'}
                  </Badge>
                  {results.sessionTest?.error && (
                    <p className="text-red-600 mt-1">{results.sessionTest.error}</p>
                  )}
                </div>
              </div>

              {/* Database Test */}
              <div>
                <h4 className="font-semibold mb-2">Database Connection</h4>
                <div className="text-sm">
                  <Badge variant={results.databaseTest?.success ? 'default' : 'destructive'}>
                    {results.databaseTest?.success ? 'Connected' : 'Failed'}
                  </Badge>
                  {results.databaseTest?.error && (
                    <p className="text-red-600 mt-1">{results.databaseTest.error}</p>
                  )}
                </div>
              </div>

              {/* RLS Test */}
              <div>
                <h4 className="font-semibold mb-2">RLS Policies</h4>
                <div className="text-sm">
                  <Badge variant={results.rlsTest?.success ? 'default' : 'destructive'}>
                    {results.rlsTest?.success ? 'Working' : 'Failed'}
                  </Badge>
                  {results.rlsTest?.error && (
                    <p className="text-red-600 mt-1">{results.rlsTest.error}</p>
                  )}
                </div>
              </div>

              {/* Errors */}
              {results.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertDescription>
                    <h4 className="font-semibold mb-2">Issues Found:</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {results.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Recommendations */}
              {results.recommendations.length > 0 && (
                <Alert>
                  <AlertDescription>
                    <h4 className="font-semibold mb-2">Recommendations:</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {results.recommendations.map((rec, index) => (
                        <li key={index}>{rec}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Debug Info */}
              <details className="text-xs">
                <summary className="cursor-pointer font-semibold">Debug Information</summary>
                <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto">
                  {JSON.stringify(results, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}; 