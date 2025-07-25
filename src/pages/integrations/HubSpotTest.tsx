import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/index';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Alert, AlertDescription } from '@/shared/components/ui/Alert';
import { Loader2, CheckCircle, XCircle, RefreshCw, Database, Users, Building2, TrendingUp } from 'lucide-react';

interface TestResult {
  success: boolean;
  message: string;
  details?: any;
  timestamp: string;
}

export default function HubSpotTest() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [integrationStatus, setIntegrationStatus] = useState<any>(null);

  useEffect(() => {
    if (user?.id) {
      checkIntegrationStatus();
    }
  }, [user?.id]);

  const checkIntegrationStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('user_integrations')
        .select('*')
        .eq('userid', user?.id)
        .eq('integrationname', 'HubSpot')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking integration status:', error);
      }

      setIntegrationStatus(data);
    } catch (error) {
      console.error('Error checking integration status:', error);
    }
  };

  const runHubSpotTest = async () => {
    if (!user?.id) {
      addTestResult({
        success: false,
        message: 'User not authenticated',
        timestamp: new Date().toISOString()
      });
      return;
    }

    setLoading(true);
    const newResults: TestResult[] = [];

    try {
      // Test 1: Check if HubSpot integration exists
      const { data: integrationData, error: integrationError } = await supabase
        .from('user_integrations')
        .select('*')
        .eq('userid', user.id)
        .eq('integrationname', 'HubSpot')
        .single();

      if (integrationError || !integrationData) {
        newResults.push({
          success: false,
          message: 'HubSpot integration not found',
          details: integrationError?.message,
          timestamp: new Date().toISOString()
        });
      } else {
        newResults.push({
          success: true,
          message: 'HubSpot integration found',
          details: integrationData,
          timestamp: new Date().toISOString()
        });
      }

      // Test 2: Check OAuth tokens
      const { data: tokenData, error: tokenError } = await supabase
        .from('oauth_tokens')
        .select('*')
        .eq('user_id', user.id)
        .eq('integration_slug', 'hubspot')
        .single();

      if (tokenError || !tokenData) {
        newResults.push({
          success: false,
          message: 'HubSpot OAuth tokens not found',
          details: tokenError?.message,
          timestamp: new Date().toISOString()
        });
      } else {
        newResults.push({
          success: true,
          message: 'HubSpot OAuth tokens found',
          details: { hasAccessToken: !!tokenData.access_token, hasRefreshToken: !!tokenData.refresh_token },
          timestamp: new Date().toISOString()
        });
      }

      // Test 3: Test HubSpot API connection
      if (tokenData?.access_token) {
        try {
          const response = await fetch('/api/hubspot-test', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
            },
            body: JSON.stringify({ userId: user.id })
          });

          const result = await response.json();

          if (response.ok && result.success) {
            newResults.push({
              success: true,
              message: 'HubSpot API connection successful',
              details: result,
              timestamp: new Date().toISOString()
            });
          } else {
            newResults.push({
              success: false,
              message: 'HubSpot API connection failed',
              details: result.error || 'Unknown error',
              timestamp: new Date().toISOString()
            });
          }
        } catch (apiError) {
          newResults.push({
            success: false,
            message: 'HubSpot API test failed',
            details: apiError,
            timestamp: new Date().toISOString()
          });
        }
      }

    } catch (error) {
      newResults.push({
        success: false,
        message: 'Test execution failed',
        details: error,
        timestamp: new Date().toISOString()
      });
    }

    setTestResults(prev => [...newResults, ...prev]);
    setLoading(false);
  };

  const addTestResult = (result: TestResult) => {
    setTestResults(prev => [result, ...prev]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">HubSpot Integration Test</h1>
          <p className="text-muted-foreground mt-2">
            Test your HubSpot integration and verify API connectivity
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={runHubSpotTest}
            disabled={loading}
            className="flex items-center space-x-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            <span>{loading ? 'Testing...' : 'Run Tests'}</span>
          </Button>
          <Button
            variant="outline"
            onClick={clearResults}
            disabled={testResults.length === 0}
          >
            Clear Results
          </Button>
        </div>
      </div>

      {/* Integration Status */}
      {integrationStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="w-5 h-5" />
              <span>Integration Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Badge variant={integrationStatus.status === 'active' ? 'default' : 'secondary'}>
                  {integrationStatus.status}
                </Badge>
                <span className="text-sm text-muted-foreground">Status</span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline">
                  {integrationStatus.integrationtype}
                </Badge>
                <span className="text-sm text-muted-foreground">Type</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">
                  {new Date(integrationStatus.created_at).toLocaleDateString()}
                </span>
                <span className="text-sm text-muted-foreground">Created</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5" />
              <span>Test Results</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {testResults.map((result, index) => (
                <Alert key={index} variant={result.success ? 'default' : 'destructive'}>
                  <div className="flex items-start space-x-2">
                    {result.success ? (
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <AlertDescription className="font-medium">
                        {result.message}
                      </AlertDescription>
                      {result.details && (
                        <details className="mt-2">
                          <summary className="text-sm text-muted-foreground cursor-pointer">
                            View Details
                          </summary>
                          <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
                            {JSON.stringify(result.details, null, 2)}
                          </pre>
                        </details>
                      )}
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(result.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Test Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium mt-0.5">
                1
              </div>
              <div>
                <h4 className="font-medium">Integration Check</h4>
                <p className="text-sm text-muted-foreground">
                  Verifies that your HubSpot integration is properly configured in the database.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium mt-0.5">
                2
              </div>
              <div>
                <h4 className="font-medium">OAuth Token Validation</h4>
                <p className="text-sm text-muted-foreground">
                  Checks if your OAuth tokens are present and valid for API access.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium mt-0.5">
                3
              </div>
              <div>
                <h4 className="font-medium">API Connection Test</h4>
                <p className="text-sm text-muted-foreground">
                  Tests the actual connection to HubSpot's API and retrieves sample data.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 