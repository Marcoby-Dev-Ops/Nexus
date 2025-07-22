import React, { useState } from 'react';
import { AuthDebugger } from '@/domains/admin/user/components/AuthDebugger';
import { AuthDiagnostic } from '@/shared/components/AuthDiagnostic';
import { SessionDebugPanel } from '@/shared/components/auth/SessionDebugPanel';
import { AuthStatus } from '@/domains/admin/user/pages/AuthStatus';
import { ApiManagerTest } from '@/shared/components/ApiManagerTest';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { CheckCircle, XCircle, AlertCircle, Info, RefreshCw } from 'lucide-react';
import { supabase, diagnoseJWTTransmission, debugClientInstances, clearAllClientInstances } from "@/core/supabase";
import { useAuthContext } from '@/domains/admin/user/hooks/AuthContext';

export default function DebugPage() {
  const { retrySessionFetch } = useAuthContext();
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

  const testJWTTransmission = async () => {
    try {
      const results = await diagnoseJWTTransmission();
      console.log('JWT Transmission Test Results:', results);
      alert(`JWT Transmission Test Complete. Check console for details.`);
    } catch (err) {
      console.error('JWT transmission test failed:', err);
      alert(`JWT transmission test failed: ${err}`);
    }
  };

  const monitorSessionChanges = () => {
    console.log('🔍 Starting session change monitoring...');
    
    // Monitor localStorage changes
    const originalSetItem = localStorage.setItem;
    const originalRemoveItem = localStorage.removeItem;
    const originalClear = localStorage.clear;
    
    localStorage.setItem = function(key, value) {
      console.log(`📝 localStorage.setItem: ${key} = ${value}`);
      return originalSetItem.apply(this, [key, value]);
    };
    
    localStorage.removeItem = function(key) {
      console.log(`🗑️ localStorage.removeItem: ${key}`);
      return originalRemoveItem.apply(this, [key]);
    };
    
    localStorage.clear = function() {
      console.log(`🧹 localStorage.clear called`);
      return originalClear.apply(this, []);
    };
    
    // Monitor sessionStorage changes
    const originalSessionSetItem = sessionStorage.setItem;
    const originalSessionRemoveItem = sessionStorage.removeItem;
    const originalSessionClear = sessionStorage.clear;
    
    sessionStorage.setItem = function(key, value) {
      console.log(`📝 sessionStorage.setItem: ${key} = ${value}`);
      return originalSessionSetItem.apply(this, [key, value]);
    };
    
    sessionStorage.removeItem = function(key) {
      console.log(`🗑️ sessionStorage.removeItem: ${key}`);
      return originalSessionRemoveItem.apply(this, [key]);
    };
    
    sessionStorage.clear = function() {
      console.log(`🧹 sessionStorage.clear called`);
      return originalSessionClear.apply(this, []);
    };
    
    alert('Session monitoring started. Check console for storage changes.');
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
              onClick={testJWTTransmission}
            >
              Test JWT Transmission
            </Button>
            <Button 
              variant="outline" 
              onClick={async () => {
                try {
                  const { error } = await supabase.auth.refreshSession();
                  if (error) {
                    alert(`Session refresh failed: ${error.message}`);
                  } else {
                    alert('Session refreshed successfully!');
                  }
                } catch (err) {
                  alert(`Session refresh error: ${err}`);
                }
              }}
            >
              Refresh Session
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
            <Button 
              variant="outline" 
              onClick={monitorSessionChanges}
            >
              Monitor Session Changes
            </Button>
            <Button 
              variant="outline" 
              onClick={debugClientInstances}
            >
              Debug Client Instances
            </Button>
            <Button 
              variant="outline" 
              onClick={clearAllClientInstances}
            >
              Clear Client Instances
            </Button>
            <Button 
              variant="outline" 
              onClick={async () => {
                try {
                  // Check current session state
                  const { data: { session }, error } = await supabase.auth.getSession();
                  console.log('🔍 Current session state:', {
                    hasSession: !!session,
                    userId: session?.user?.id,
                    email: session?.user?.email,
                    expiresAt: session?.expires_at,
                    error: error?.message
                  });
                  
                  // Check localStorage
                  const storedSession = localStorage.getItem('nexus_auth_session');
                  console.log('📦 Stored session:', storedSession ? JSON.parse(storedSession) : null);
                  
                  // Check sessionStorage
                  const currentSession = sessionStorage.getItem('nexus_current_session');
                  console.log('📦 Current session storage:', currentSession ? JSON.parse(currentSession) : null);
                  
                  alert('Session state logged to console. Check browser console for details.');
                } catch (err) {
                  console.error('Session check failed:', err);
                  alert(`Session check failed: ${err}`);
                }
              }}
            >
              Check Session State
            </Button>
            <Button 
              variant="outline" 
              onClick={async () => {
                try {
                  // Test the session persistence fix
                  const { data: { session }, error } = await supabase.auth.getSession();
                  
                  if (error || !session) {
                    alert('No session available to test');
                    return;
                  }
                  
                  // Store session with correct time units
                  const sessionData = {
                    accessToken: session.access_token,
                    refreshToken: session.refresh_token,
                    expiresAt: session.expires_at, // This is in seconds
                    userId: session.user?.id,
                    email: session.user?.email,
                    timestamp: Date.now()
                  };
                  
                  localStorage.setItem('nexus_auth_session', JSON.stringify(sessionData));
                  
                  // Test the fix by reading it back
                  const storedSession = localStorage.getItem('nexus_auth_session');
                  const parsedSession = JSON.parse(storedSession!);
                  
                  const now = Date.now();
                  const expiresAtMs = parsedSession.expiresAt * 1000; // Convert seconds to milliseconds
                  const isValid = expiresAtMs > now;
                  
                  console.log('🧪 Session persistence test:', {
                    originalExpiresAt: session.expires_at,
                    storedExpiresAt: parsedSession.expiresAt,
                    expiresAtMs,
                    now,
                    isValid,
                    timeRemaining: expiresAtMs - now
                  });
                  
                  alert(`Session persistence test complete. Valid: ${isValid}. Check console for details.`);
                } catch (err) {
                  console.error('Session persistence test failed:', err);
                  alert(`Session persistence test failed: ${err}`);
                }
              }}
            >
              Test Session Persistence Fix
            </Button>

            <Button 
              variant="outline" 
              onClick={() => {
                // Monitor component re-renders and database calls
                console.log('🔍 Performance monitoring started...');
                
                // Monitor React component renders
                const originalConsoleLog = console.log;
                let renderCount = 0;
                
                console.log = function(...args) {
                  if (args[0] && typeof args[0] === 'string' && args[0].includes('Rendering')) {
                    renderCount++;
                    originalConsoleLog(`📊 Render #${renderCount}:`, ...args);
                  } else {
                    originalConsoleLog.apply(console, args);
                  }
                };
                
                // Monitor database requests
                const originalFetch = window.fetch;
                let dbCallCount = 0;
                
                window.fetch = function(...args) {
                  const url = args[0];
                  if (typeof url === 'string' && url.includes('supabase.co')) {
                    dbCallCount++;
                    console.log(`🗄️ Database call #${dbCallCount}:`, url);
                  }
                  return originalFetch.apply(window, args);
                };
                
                alert('Performance monitoring started. Check console for render and database call counts.');
              }}
            >
              Monitor Performance
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

      {/* Authentication Diagnostic */}
      <AuthDiagnostic />

      {/* API Manager Test */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            API Manager Test
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ApiManagerTest />
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

      {/* Floating Debug Panel */}
      <SessionDebugPanel />
    </div>
  );
} 