import React, { useState, useEffect } from 'react';
import { Button } from '@/shared/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { Alert, AlertDescription } from '@/shared/components/ui/Alert';
import { authentikAuthService } from '@/core/auth/authentikAuthServiceInstance';
import { logger } from '@/shared/utils/logger';

interface DiagnosticResult {
  success: boolean;
  message: string;
  details?: any;
  timestamp: string;
}

interface AuthDiagnosticPanelProps {
  className?: string;
}

export const AuthDiagnosticPanel: React.FC<AuthDiagnosticPanelProps> = ({ className = '' }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [session, setSession] = useState<any>(null);

  const runDiagnostics = async () => {
    setIsRunning(true);
    const newResults: DiagnosticResult[] = [];

    try {
      // Test 1: Basic session retrieval
      logger.info('Running basic session test...');
      const sessionResult = await authentikAuthService.getSession();
      
      if (sessionResult.error) {
        newResults.push({
          success: false,
          message: 'Session retrieval failed',
          details: sessionResult.error,
          timestamp: new Date().toISOString()
        });
      } else {
        newResults.push({
          success: true,
          message: 'Session retrieved successfully',
          details: { hasSession: !!sessionResult.session },
          timestamp: new Date().toISOString()
        });
        setSession(sessionResult.session);
      }

      // Test 2: Auth diagnostics
      logger.info('Running auth diagnostics...');
      const authDiagnostics = await authentikAuthService.getAuthStatus();
      
      newResults.push({
        success: authDiagnostics.isAuthenticated,
        message: 'Auth configuration check',
        details: authDiagnostics,
        timestamp: new Date().toISOString()
      });

      // Test 3: Session fix attempt
      logger.info('Testing session fix...');
      const fixResult = await authentikAuthService.refreshSession();
      
      newResults.push({
        success: !fixResult.error,
        message: 'Session fix attempt',
        details: fixResult,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error({ error }, 'Diagnostic test failed');
      newResults.push({
        success: false,
        message: 'Diagnostic test failed',
        details: error,
        timestamp: new Date().toISOString()
      });
    }

    setResults(newResults);
    setIsRunning(false);
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔧 Auth Diagnostics
          <Badge variant="outline">Debug</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={runDiagnostics} 
            disabled={isRunning}
            variant="outline"
          >
            {isRunning ? 'Running...' : 'Run Diagnostics'}
          </Button>
          <Button 
            onClick={clearResults} 
            variant="ghost"
            size="sm"
          >
            Clear Results
          </Button>
        </div>

        {results.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium">Results:</h4>
            {results.map((result, index) => (
              <Alert key={index} variant={result.success ? 'default' : 'destructive'}>
                <AlertDescription>
                  <div className="flex items-center justify-between">
                    <span>{result.message}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(result.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  {result.details && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm">View Details</summary>
                      <pre className="mt-1 text-xs bg-muted p-2 rounded overflow-auto">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {session && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Current Session:</h4>
            <div className="text-sm space-y-1">
              <div>User ID: {session.user?.id || 'N/A'}</div>
              <div>Email: {session.user?.email || 'N/A'}</div>
              <div>Has Access Token: {session.access_token ? 'Yes' : 'No'}</div>
              <div>Token Length: {session.access_token?.length || 0}</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 
