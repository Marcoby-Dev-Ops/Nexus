import React, { useState } from 'react';
import { AuthDebugger } from '@/domains/admin/shared/pages/AuthDebugger';
import { AuthStatus } from '@/domains/admin/user/pages/AuthStatus';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { CheckCircle, XCircle, AlertCircle, Info, RefreshCw } from 'lucide-react';
import { supabase } from "@/core/supabase";
import { useAuth } from '@/domains/admin/user/hooks/AuthContext';

export default function DebugPage() {
  const { retrySessionFetch } = useAuth();
  const [systemChecks, setSystemChecks] = React.useState({
    localStorage: false,
    sessionStorage: false,
    indexedDB: false,
    network: false,
    supabase: false,
  });

  // Timeout Diagnostics state
  const [diagResult, setDiagResult] = useState<null | {
    ping: { ms: number | null, ok: boolean };
    query: { ms: number | null, ok: boolean };
    build: { env: string; buildTime?: string; version?: string };
    error?: string;
  }>(null);
  const [diagLoading, setDiagLoading] = useState(false);

  React.useEffect(() => {
    // Run system checks
    const checks = {
      localStorage: (() => {
        try {
          localStorage.setItem('test', 'test');
          localStorage.removeItem('test');
          return true;
        } catch {
          return false;
        }
      })(),
      sessionStorage: (() => {
        try {
          sessionStorage.setItem('test', 'test');
          sessionStorage.removeItem('test');
          return true;
        } catch {
          return false;
        }
      })(),
      indexedDB: (() => {
        try {
          return 'indexedDB' in window;
        } catch {
          return false;
        }
      })(),
      network: navigator.onLine,
      supabase: !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY),
    };

    setSystemChecks(checks);
  }, []);

  const getCheckIcon = (passed: boolean) => {
    return passed ? (
      <CheckCircle className="w-4 h-4 text-success" />
    ) : (
      <XCircle className="w-4 h-4 text-destructive" />
    );
  };

  const clearAllStorage = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
    } catch (err) {
      console.error('Failed to clear storage:', err);
    }
  };

  const testSupabaseConnection = async () => {
    try {
      // Use the existing Supabase client instead of creating a new one
      const { data, error } = await supabase.auth.getSession();
      console.log('Supabase connection test:', { data, error });
      
      if (error) {
        alert(`Supabase connection failed: ${error.message}`);
      } else {
        alert('Supabase connection successful!');
      }
    } catch (err) {
      console.error('Supabase connection test failed:', err);
      alert(`Supabase connection test failed: ${err}`);
    }
  };

  // Run diagnostics
  const runDiagnostics = async () => {
    setDiagLoading(true);
    setDiagResult(null);
    let pingMs: number | null = null;
    let pingOk = false;
    let queryMs: number | null = null;
    let queryOk = false;
    let errorMsg = '';
    // 1. Supabase Ping
    try {
      const start = Date.now();
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/`, {
        method: 'HEAD',
        headers: { 'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY },
      });
      pingMs = Date.now() - start;
      pingOk = resp.ok && pingMs < 10000;
      if (!pingOk) errorMsg = 'Supabase ping failed or slow.';
    } catch {
      pingMs = null;
      pingOk = false;
      errorMsg = 'Supabase ping failed.';
    }
    // 2. Supabase Simple Query
    try {
      const start = Date.now();
      // Use a small, public table for a fast query (user_profiles or companies)
      const { error } = await supabase.from('user_profiles').select('id').limit(1);
      queryMs = Date.now() - start;
      queryOk = !error && queryMs < 10000;
      if (error) errorMsg = 'Supabase query error: ' + error.message;
      if (!queryOk && !error) errorMsg = 'Supabase query slow.';
    } catch {
      queryMs = null;
      queryOk = false;
      errorMsg = 'Supabase query failed.';
    }
    // 3. Build Info
    const build = {
      env: import.meta.env.MODE,
      buildTime: import.meta.env.VITE_BUILD_TIME || undefined,
      version: import.meta.env.VITE_APP_VERSION || undefined,
    };
    setDiagResult({
      ping: { ms: pingMs, ok: pingOk },
      query: { ms: queryMs, ok: queryOk },
      build,
      error: !pingOk || !queryOk ? errorMsg : undefined,
    });
    setDiagLoading(false);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">🔧 Debug Dashboard</h1>
        <p className="text-muted-foreground">
          Diagnose authentication and frontend issues
        </p>
      </div>

      {/* Timeout Diagnostics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Timeout Diagnostics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Button onClick={runDiagnostics} disabled={diagLoading}>
              {diagLoading ? 'Running...' : 'Run Diagnostics'}
            </Button>
          </div>
          {diagResult && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-medium">Supabase Ping:</span>
                <Badge variant={diagResult.ping.ok ? 'default' : 'destructive'}>
                  {diagResult.ping.ok ? 'OK' : 'FAIL'}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {diagResult.ping.ms !== null ? `${diagResult.ping.ms} ms` : 'N/A'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Supabase Query:</span>
                <Badge variant={diagResult.query.ok ? 'default' : 'destructive'}>
                  {diagResult.query.ok ? 'OK' : 'FAIL'}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {diagResult.query.ms !== null ? `${diagResult.query.ms} ms` : 'N/A'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Build Info:</span>
                <Badge variant="default">{diagResult.build.env}</Badge>
                {diagResult.build.buildTime && (
                  <span className="text-xs text-muted-foreground">Build: {diagResult.build.buildTime}</span>
                )}
                {diagResult.build.version && (
                  <span className="text-xs text-muted-foreground">Version: {diagResult.build.version}</span>
                )}
              </div>
              {diagResult.error && (
                <div className="text-destructive font-medium mt-2">
                  {diagResult.error}
                  <div className="text-xs text-muted-foreground mt-1">
                    {diagResult.ping.ok === false
                      ? 'Likely a network or Supabase outage.'
                      : diagResult.query.ok === false
                      ? 'Supabase database may be slow or overloaded.'
                      : 'Check build and environment.'}
                  </div>
                </div>
              )}
              {!diagResult.error && (
                <div className="text-success font-medium mt-2">
                  All diagnostics passed. No timeout issues detected.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Checks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            System Checks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(systemChecks).map(([key, passed]) => (
              <div key={key} className="flex items-center gap-2">
                {getCheckIcon(passed)}
                <span className="font-medium capitalize">{key}</span>
                <Badge variant={passed ? "default" : "destructive"}>
                  {passed ? "OK" : "FAIL"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Environment Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            Environment Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">VITE_SUPABASE_URL:</span>
              <span className="ml-2 text-muted-foreground">
                {import.meta.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Missing'}
              </span>
            </div>
            <div>
              <span className="font-medium">VITE_SUPABASE_ANON_KEY:</span>
              <span className="ml-2 text-muted-foreground">
                {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}
              </span>
            </div>
            <div>
              <span className="font-medium">NODE_ENV:</span>
              <span className="ml-2 text-muted-foreground">
                {import.meta.env.MODE}
              </span>
            </div>
            <div>
              <span className="font-medium">Base URL:</span>
              <span className="ml-2 text-muted-foreground">
                {import.meta.env.BASE_URL}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Debug Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Debug Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              onClick={testSupabaseConnection}
            >
              Test Supabase Connection
            </Button>
            <Button 
              variant="outline" 
              onClick={clearAllStorage}
            >
              Clear All Storage
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
            >
              Reload Page
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                console.clear();
                console.log('Console cleared');
              }}
            >
              Clear Console
            </Button>
            <Button 
              variant="outline" 
              onClick={retrySessionFetch}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Retry Session Fetch
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Auth Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            Quick Auth Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AuthStatus showDetails={true} />
        </CardContent>
      </Card>

      {/* Authentication Debugger */}
      <AuthDebugger />

      {/* Console Output */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            Console Output
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-4 rounded-md">
            <p className="text-sm text-muted-foreground">
              Open your browser's developer console (F12) to see detailed logs and errors.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Look for messages starting with [AuthContext] for authentication debugging.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 