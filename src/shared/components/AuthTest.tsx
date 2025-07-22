import React, { useState } from 'react';
import { Button } from '@/shared/components/ui/Button';
import { testAuthentication, testInsertDebugLog } from '@/core/testAuth';
import { useAuthContext } from '@/domains/admin/user/hooks/AuthContext';

export const AuthTest: React.FC = () => {
  const [testResult, setTestResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { user, session } = useAuthContext();

  const runAuthTest = async () => {
    setLoading(true);
    try {
      const result = await testAuthentication();
      setTestResult(result);
      console.log('Auth test result:', result);
    } catch (error) {
      console.error('Auth test error:', error);
      setTestResult({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  const runInsertTest = async () => {
    setLoading(true);
    try {
      const result = await testInsertDebugLog();
      setTestResult(result);
      console.log('Insert test result:', result);
    } catch (error) {
      console.error('Insert test error:', error);
      setTestResult({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <h3 className="text-lg font-semibold mb-4">Authentication Test</h3>
      
      <div className="mb-4">
        <p><strong>Current User:</strong> {user?.email || 'None'}</p>
        <p><strong>User ID:</strong> {user?.id || 'None'}</p>
        <p><strong>Session:</strong> {session ? 'Active' : 'None'}</p>
      </div>

      <div className="space-x-2 mb-4">
        <Button 
          onClick={runAuthTest} 
          disabled={loading}
          variant="outline"
        >
          {loading ? 'Testing...' : 'Test Authentication'}
        </Button>
        
        <Button 
          onClick={runInsertTest} 
          disabled={loading}
          variant="outline"
        >
          {loading ? 'Testing...' : 'Test Insert Debug Log'}
        </Button>
      </div>

      {testResult && (
        <div className="mt-4 p-3 bg-white border rounded">
          <h4 className="font-medium mb-2">Test Results:</h4>
          <pre className="text-sm bg-gray-100 p-2 rounded overflow-auto">
            {JSON.stringify(testResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}; 