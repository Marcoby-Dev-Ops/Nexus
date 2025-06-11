import React, { useState } from 'react';
import { useSupabase } from '@/lib/SupabaseProvider';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error' | 'warning';
  message: string;
}

/**
 * ChatSystemTest Component
 * 
 * A diagnostic component to test the chat system integration
 */
export const ChatSystemTest: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const { user } = useSupabase();

  const runTests = async () => {
    setIsRunning(true);
    const testResults: TestResult[] = [];

    // Test 1: User Authentication
    testResults.push({
      name: 'User Authentication',
      status: user ? 'success' : 'error',
      message: user ? `Authenticated as ${user.email}` : 'No user authenticated'
    });

    // Test 2: Chat Context Service
    try {
      const { enhancedChatService } = await import('@/lib/chatContext');
      testResults.push({
        name: 'Chat Context Service',
        status: 'success',
        message: 'Chat service loaded successfully'
      });
    } catch (error) {
      testResults.push({
        name: 'Chat Context Service',
        status: 'error',
        message: `Failed to load chat service: ${error}`
      });
    }

    // Test 3: Agent Registry
    try {
      const { executiveAgent } = await import('@/lib/agentRegistry');
      testResults.push({
        name: 'Agent Registry',
        status: executiveAgent ? 'success' : 'warning',
        message: executiveAgent ? `Executive agent loaded: ${executiveAgent.name}` : 'Executive agent not found'
      });
    } catch (error) {
      testResults.push({
        name: 'Agent Registry',
        status: 'error',
        message: `Failed to load agent registry: ${error}`
      });
    }

    // Test 4: Chat History Service
    try {
      const { chatHistory } = await import('@/lib/supabase');
      const conversations = await chatHistory.getRecentConversations(1);
      testResults.push({
        name: 'Chat History Service',
        status: 'success',
        message: `Chat history loaded, found ${conversations?.length || 0} recent conversations`
      });
    } catch (error) {
      testResults.push({
        name: 'Chat History Service',
        status: 'error',
        message: `Failed to access chat history: ${error}`
      });
    }

    // Test 5: Supabase Connection
    try {
      const { supabase } = await import('@/lib/supabase');
      const { data, error } = await supabase.from('conversations').select('count').limit(1);
      testResults.push({
        name: 'Supabase Connection',
        status: error ? 'error' : 'success',
        message: error ? `Database error: ${error.message}` : 'Database connection successful'
      });
    } catch (error) {
      testResults.push({
        name: 'Supabase Connection',
        status: 'error',
        message: `Failed to connect to database: ${error}`
      });
    }

    setResults(testResults);
    setIsRunning(false);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-warning" />;
      default:
        return <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />;
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Chat System Integration Test</CardTitle>
        <CardDescription>
          Verify that all chat system components are properly connected
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runTests} 
          disabled={isRunning}
          className="w-full"
        >
          {isRunning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isRunning ? 'Running Tests...' : 'Run Integration Tests'}
        </Button>

        {results.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-foreground">Test Results:</h3>
            {results.map((result, index) => (
              <div
                key={index}
                className="flex items-start gap-4 p-4 rounded-lg border bg-card"
              >
                {getStatusIcon(result.status)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {result.name}
                  </p>
                  <p className="text-xs text-muted-foreground break-words">
                    {result.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {results.length > 0 && (
          <div className="mt-4 p-4 rounded-lg bg-muted">
            <p className="text-sm text-muted-foreground">
              <strong>Summary:</strong>{' '}
              {results.filter(r => r.status === 'success').length} passed,{' '}
              {results.filter(r => r.status === 'warning').length} warnings,{' '}
              {results.filter(r => r.status === 'error').length} errors
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ChatSystemTest; 