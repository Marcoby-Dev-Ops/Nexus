import React, { useState } from 'react';
import { Button } from '@/shared/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Alert, AlertDescription } from '@/shared/components/ui/Alert';
import { diagnoseAuthIssues, sessionUtils, testAndFixSession } from '@/core/supabase';
import { smartClient } from '@/core/supabase';

interface DiagnosticResult {
  serviceRoleKey: boolean;
  anonKey: boolean;
  supabaseUrl: boolean;
  serviceClientTest: boolean;
  regularClientTest: boolean;
  authSession: any;
  errors: string[];
}

export const AuthDiagnostic: React.FC = () => {
  const [results, setResults] = useState<DiagnosticResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [smartClientTest, setSmartClientTest] = useState<any>(null);
  const [sessionStatus, setSessionStatus] = useState<any>(null);

  const runDiagnosis = async () => {
    setLoading(true);
    try {
      const diagnosisResults = await diagnoseAuthIssues();
      setResults(diagnosisResults);
      
      // Check session status using sessionUtils
      const sessionResult = await sessionUtils.getSession();
      const session = sessionResult.session;
      const error = sessionResult.error;
      
      setSessionStatus({
        hasSession: !!session,
        isExpired: session ? sessionUtils.isSessionValid(session) === false: true,
        userEmail: session?.user?.email,
        expiresAt: session?.expires_at,
        expiresAtType: typeof session?.expires_at,
        sessionData: session ? {
          hasUser: !!session.user,
          userId: session.user?.id,
          hasAccessToken: !!session.access_token,
          tokenLength: session.access_token?.length,
          expiresAt: session.expires_at,
          expiresAtType: typeof session.expires_at,
        } : null,
        error: error?.message
      });
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Diagnosis failed: ', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshSession = async () => {
    setLoading(true);
    try {
      const result = await sessionUtils.refreshSession();
      if (result.success) {
        // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('✅ Session refreshed successfully');
        // Re-run diagnosis
        await runDiagnosis();
      } else {
        // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('❌ Session refresh failed: ', result.error);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Session refresh error: ', error);
    } finally {
      setLoading(false);
    }
  };

  const forceRefreshSession = async () => {
    setLoading(true);
    try {
      const result = await sessionUtils.forceRefreshSession();
      if (result.success) {
        // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('✅ Force session refresh successful');
        // Re-run diagnosis
        await runDiagnosis();
      } else {
        // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('❌ Force session refresh failed: ', result.error);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Force session refresh error: ', error);
    } finally {
      setLoading(false);
    }
  };

  const testAndFixSessionState = async () => {
    setLoading(true);
    try {
      const result = await testAndFixSession();
      if (result.success) {
        // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('✅ Session test and fix successful');
        // Re-run diagnosis
        await runDiagnosis();
      } else {
        // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('❌ Session test and fix failed: ', result.error);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Session test and fix error: ', error);
    } finally {
      setLoading(false);
    }
  };

  const testSmartClient = async () => {
    setLoading(true);
    try {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('🧪 Testing supabase...');
      
      // Test service role key
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('🔧 Service role key check: ');
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('🔧 Key length: ', import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY?.length || 'undefined');
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('🔧 Key starts with: ', import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20) + '...' || 'undefined');
      
      // Test oauth_tokens
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('🧪 Testing oauth_tokens...');
      const { data: oauthData, error: oauthError } = await supabase
        .from('oauth_tokens')
        .select('*')
        .limit(1);
      
      // Test ai_inbox_items
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('🧪 Testing ai_inbox_items...');
      const { data: inboxData, error: inboxError } = await supabase
        .from('ai_inbox_items')
        .select('*')
        .limit(1);
      
      setSmartClientTest({
        oauth: { data: oauthData, error: oauthError },
        inbox: { data: inboxData, error: inboxError }
      });
      
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('📊 SmartClient Test Results: ', {
        oauth: { data: oauthData, error: oauthError },
        inbox: { data: inboxData, error: inboxError }
      });
      
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('SmartClient test failed: ', error);
      setSmartClientTest({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle>Authentication Diagnostic</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Button onClick={runDiagnosis} disabled={loading}>
              {loading ? 'Running...' : 'Run Full Diagnosis'}
            </Button>
            <Button onClick={testSmartClient} disabled={loading} variant="outline">
              {loading ? 'Testing...' : 'Test SmartClient'}
            </Button>
            <Button onClick={refreshSession} disabled={loading} variant="outline">
              {loading ? 'Refreshing...' : 'Refresh Session'}
            </Button>
            <Button onClick={forceRefreshSession} disabled={loading} variant="outline">
              {loading ? 'Force Refreshing...' : 'Force Refresh Session'}
            </Button>
            <Button onClick={testAndFixSessionState} disabled={loading} variant="outline">
              {loading ? 'Testing...' : 'Test & Fix Session'}
            </Button>
          </div>

          {sessionStatus && (
            <div className="space-y-2">
              <h3 className="font-semibold">Session Status: </h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Has Session: {sessionStatus.hasSession ? '✅' : '❌'}</div>
                <div>Is Expired: {sessionStatus.isExpired ? '❌' : '✅'}</div>
                <div>User Email: {sessionStatus.userEmail || 'None'}</div>
                <div>Expires At: {sessionStatus.expiresAt ? 
                  (typeof sessionStatus.expiresAt === 'number' ? 
                    new Date(sessionStatus.expiresAt * 1000).toLocaleString() : 
                    new Date(sessionStatus.expiresAt).toLocaleString()
                  ) : 'None'}</div>
                <div>Expires At Type: {sessionStatus.expiresAtType || 'None'}</div>
              </div>
              {sessionStatus.sessionData && (
                <div className="text-xs bg-gray-100 p-2 rounded">
                  <div className="font-semibold">Session Details:</div>
                  <div>Has User: {sessionStatus.sessionData.hasUser ? '✅' : '❌'}</div>
                  <div>User ID: {sessionStatus.sessionData.userId || 'None'}</div>
                  <div>Has Access Token: {sessionStatus.sessionData.hasAccessToken ? '✅' : '❌'}</div>
                  <div>Token Length: {sessionStatus.sessionData.tokenLength || 'None'}</div>
                  <div>Raw Expires At: {sessionStatus.sessionData.expiresAt || 'None'}</div>
                  <div>Expires At Type: {sessionStatus.sessionData.expiresAtType || 'None'}</div>
                </div>
              )}
              {sessionStatus.error && (
                <Alert>
                  <AlertDescription>Session Error: {sessionStatus.error}</AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {results && (
            <div className="space-y-2">
              <h3 className="font-semibold">Diagnosis Results: </h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Service Role Key: {results.serviceRoleKey ? '✅' : '❌'}</div>
                <div>Anon Key: {results.anonKey ? '✅' : '❌'}</div>
                <div>Supabase URL: {results.supabaseUrl ? '✅' : '❌'}</div>
                <div>Service Client Test: {results.serviceClientTest ? '✅' : '❌'}</div>
                <div>Regular Client Test: {results.regularClientTest ? '✅' : '❌'}</div>
              </div>
              
              {results.authSession && (
                <div className="text-sm">
                  <div>Session User: {results.authSession.user.email}</div>
                  <div>Session User ID: {results.authSession.user.id}</div>
                </div>
              )}
              
              {results.errors.length > 0 && (
                <Alert>
                  <AlertDescription>
                    <div className="font-semibold">Errors: </div>
                    <ul className="list-disc list-inside">
                      {results.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {smartClientTest && (
            <div className="space-y-2">
              <h3 className="font-semibold">SmartClient Test Results: </h3>
              <div className="text-sm space-y-1">
                <div>
                  oauthtokens: {smartClientTest.oauth?.error ? '❌' : '✅'}
                  {smartClientTest.oauth?.error && (
                    <div className="text-red-500 ml-2">{smartClientTest.oauth.error.message}</div>
                  )}
                </div>
                <div>
                  aiinbox_items: {smartClientTest.inbox?.error ? '❌' : '✅'}
                  {smartClientTest.inbox?.error && (
                    <div className="text-red-500 ml-2">{smartClientTest.inbox.error.message}</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}; 