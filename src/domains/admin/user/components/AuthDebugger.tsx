import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { supabase, sessionUtils } from '@/core/supabase';
import { useAuth } from '@/shared/hooks/useAuth';

export const AuthDebugger: React.FC = () => {
  const { user, session } = useAuth();
  const [testResults, setTestResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const testJWTTransmission = async () => {
    setIsLoading(true);
    try {
      console.log('🧪 Testing JWT token transmission...');
      
      // Test the new JWT transmission function
      const result = await sessionUtils.testAndFixJWTTransmission();
      console.log('JWT transmission test result:', result);
      
      if (result.success) {
        // Now test if we can access user_integrations with regular supabase client
        const { data: integrations, error: integrationsError } = await supabase
          .from('user_integrations')
          .select('*')
          .eq('user_id', user?.id);
        
        console.log('User integrations test:', { integrations, error: integrationsError });
        
        setTestResults({
          jwtTest: result,
          integrationsTest: {
            success: !integrationsError,
            data: integrations,
            error: integrationsError
          }
        });
      } else {
        setTestResults({
          jwtTest: result,
          integrationsTest: null
        });
      }
    } catch (error) {
      console.error('Test error:', error);
      setTestResults({
        jwtTest: { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
        integrationsTest: null
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testDirectAccess = async () => {
    setIsLoading(true);
    try {
      console.log('🧪 Testing direct access to user_integrations...');
      
      // Test direct access without any special handling
      const { data, error } = await supabase
        .from('user_integrations')
        .select('*')
        .eq('user_id', user?.id);
      
      console.log('Direct access test:', { data, error });
      
      setTestResults({
        directAccess: {
          success: !error,
          data,
          error
        }
      });
    } catch (error) {
      console.error('Direct access test error:', error);
      setTestResults({
        directAccess: {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testSessionAndJWT = async () => {
    setIsLoading(true);
    try {
      console.log('🧪 Testing session and JWT transmission...');
      
      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('Current session:', { session, error: sessionError });
      
      if (!session) {
        console.error('❌ No session found');
        setTestResults({
          sessionTest: {
            success: false,
            error: 'No session found'
          }
        });
        return;
      }
      
      console.log('✅ Session found:', {
        userId: session.user.id,
        email: session.user.email,
        hasAccessToken: !!session.access_token,
        tokenLength: session.access_token?.length,
        expiresAt: session.expires_at,
        currentTime: Date.now(),
        isExpired: session.expires_at ? (session.expires_at * 1000) < Date.now() : true
      });
      
      // Test if session is expired
      if (session.expires_at && (session.expires_at * 1000) < Date.now()) {
        console.log('⚠️ Session is expired, attempting refresh...');
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError || !refreshData.session) {
          console.error('❌ Session refresh failed:', refreshError);
          setTestResults({
            sessionTest: {
              success: false,
              error: 'Session expired and refresh failed'
            }
          });
          return;
        }
        console.log('✅ Session refreshed successfully');
      }
      
      // Test a simple query to see if JWT is being sent
      const { data: testData, error: testError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('id', session.user.id)
        .limit(1);
      
      console.log('JWT transmission test:', { testData, testError });
      
      setTestResults({
        sessionTest: {
          success: !testError,
          session: {
            userId: session.user.id,
            email: session.user.email,
            hasToken: !!session.access_token,
            tokenLength: session.access_token?.length,
            expiresAt: session.expires_at
          },
          testData,
          error: testError
        }
      });
    } catch (error) {
      console.error('Session test error:', error);
      setTestResults({
        sessionTest: {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔧 Auth Debugger
          <Badge variant={session ? 'default' : 'destructive'}>
            {session ? 'Active' : 'Inactive'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button 
            onClick={testJWTTransmission}
            disabled={isLoading}
            variant="outline"
          >
            {isLoading ? 'Testing...' : 'Test JWT Transmission'}
          </Button>
          
          <Button 
            onClick={testDirectAccess}
            disabled={isLoading}
            variant="outline"
          >
            {isLoading ? 'Testing...' : 'Test Direct Access'}
          </Button>

          <Button 
            onClick={testSessionAndJWT}
            disabled={isLoading}
            variant="outline"
          >
            {isLoading ? 'Testing...' : 'Test Session & JWT'}
          </Button>
        </div>

        {testResults && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Test Results:</h3>
            
            {testResults.jwtTest && (
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">JWT Transmission Test:</h4>
                <div className="text-sm space-y-1">
                  <div>Status: <Badge variant={testResults.jwtTest.success ? 'default' : 'destructive'}>
                    {testResults.jwtTest.success ? 'Success' : 'Failed'}
                  </Badge></div>
                  {testResults.jwtTest.error && (
                    <div>Error: <code className="text-red-600">{testResults.jwtTest.error}</code></div>
                  )}
                  {testResults.jwtTest.data && (
                    <div>Data: <pre className="text-xs bg-gray-100 p-2 rounded">{JSON.stringify(testResults.jwtTest.data, null, 2)}</pre></div>
                  )}
                </div>
              </div>
            )}

            {testResults.integrationsTest && (
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">User Integrations Test:</h4>
                <div className="text-sm space-y-1">
                  <div>Status: <Badge variant={testResults.integrationsTest.success ? 'default' : 'destructive'}>
                    {testResults.integrationsTest.success ? 'Success' : 'Failed'}
                  </Badge></div>
                  {testResults.integrationsTest.error && (
                    <div>Error: <code className="text-red-600">{testResults.integrationsTest.error?.message || testResults.integrationsTest.error}</code></div>
                  )}
                  {testResults.integrationsTest.data && (
                    <div>Count: <Badge variant="secondary">{testResults.integrationsTest.data.length} integrations</Badge></div>
                  )}
                </div>
              </div>
            )}

            {testResults.directAccess && (
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Direct Access Test:</h4>
                <div className="text-sm space-y-1">
                  <div>Status: <Badge variant={testResults.directAccess.success ? 'default' : 'destructive'}>
                    {testResults.directAccess.success ? 'Success' : 'Failed'}
                  </Badge></div>
                  {testResults.directAccess.error && (
                    <div>Error: <code className="text-red-600">{testResults.directAccess.error?.message || testResults.directAccess.error}</code></div>
                  )}
                  {testResults.directAccess.data && (
                    <div>Count: <Badge variant="secondary">{testResults.directAccess.data.length} integrations</Badge></div>
                  )}
                </div>
              </div>
            )}

            {testResults.sessionTest && (
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Session & JWT Test:</h4>
                <div className="text-sm space-y-1">
                  <div>Status: <Badge variant={testResults.sessionTest.success ? 'default' : 'destructive'}>
                    {testResults.sessionTest.success ? 'Success' : 'Failed'}
                  </Badge></div>
                  {testResults.sessionTest.session && (
                    <div className="space-y-1">
                      <div>User: {testResults.sessionTest.session.email}</div>
                      <div>Token: <Badge variant={testResults.sessionTest.session.hasToken ? 'default' : 'destructive'}>
                        {testResults.sessionTest.session.hasToken ? 'Present' : 'Missing'}
                      </Badge></div>
                      <div>Expires: {testResults.sessionTest.session.expiresAt ? new Date(testResults.sessionTest.session.expiresAt * 1000).toLocaleString() : 'Unknown'}</div>
                    </div>
                  )}
                  {testResults.sessionTest.error && (
                    <div>Error: <code className="text-red-600">{testResults.sessionTest.error?.message || testResults.sessionTest.error}</code></div>
                  )}
                  {testResults.sessionTest.testData && (
                    <div>Test Data: <Badge variant="secondary">{JSON.stringify(testResults.sessionTest.testData)}</Badge></div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="text-sm text-gray-600">
          <p><strong>Session Status:</strong> {session ? 'Active' : 'Inactive'}</p>
          <p><strong>User ID:</strong> {user?.id || 'None'}</p>
          <p><strong>Email:</strong> {user?.email || 'None'}</p>
          {session && (
            <p><strong>Expiry:</strong> {new Date(session.expires_at! * 1000).toLocaleString()}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}; 