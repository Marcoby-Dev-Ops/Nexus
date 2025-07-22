import React, { useState } from 'react';
import { Button } from '@/shared/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { debugSessionExpiry, forceSessionRefresh } from '@/shared/utils/sessionDebug';
import { RefreshCw, AlertCircle, CheckCircle, Clock } from 'lucide-react';

export const SessionDebugger: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [refreshResult, setRefreshResult] = useState<any>(null);

  const runDebug = async () => {
    setLoading(true);
    try {
      const info = await debugSessionExpiry();
      setDebugInfo(info);
    } catch (error) {
      console.error('Debug failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleForceRefresh = async () => {
    setLoading(true);
    try {
      const result = await forceSessionRefresh();
      setRefreshResult(result);
      // Re-run debug after refresh
      const info = await debugSessionExpiry();
      setDebugInfo(info);
    } catch (error) {
      console.error('Force refresh failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSessionStatus = () => {
    if (!debugInfo) return { status: 'unknown', color: 'bg-gray-500', icon: <AlertCircle className="w-4 h-4" /> };
    
    if (debugInfo.sessionState.isExpired) {
      return { status: 'expired', color: 'bg-red-500', icon: <AlertCircle className="w-4 h-4" /> };
    }
    
    if (debugInfo.sessionState.hasSession) {
      return { status: 'active', color: 'bg-green-500', icon: <CheckCircle className="w-4 h-4" /> };
    }
    
    return { status: 'no-session', color: 'bg-yellow-500', icon: <Clock className="w-4 h-4" /> };
  };

  const sessionStatus = getSessionStatus();

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="w-5 h-5" />
          Session Debugger
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={runDebug} disabled={loading}>
            {loading ? 'Running...' : 'Debug Session'}
          </Button>
          <Button onClick={handleForceRefresh} disabled={loading} variant="outline">
            Force Refresh
          </Button>
        </div>

        {debugInfo && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${sessionStatus.color}`}></div>
              <Badge variant="outline">
                {sessionStatus.icon}
                <span className="ml-1">{sessionStatus.status}</span>
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="text-sm font-medium">Session State</CardHeader>
                <CardContent className="text-xs space-y-1">
                  <div>Has Session: {debugInfo.sessionState.hasSession ? 'Yes' : 'No'}</div>
                  <div>Is Expired: {debugInfo.sessionState.isExpired ? 'Yes' : 'No'}</div>
                  {debugInfo.sessionState.timeUntilExpiry && (
                    <div>Time Until Expiry: {Math.round(debugInfo.sessionState.timeUntilExpiry / 1000 / 60)} minutes</div>
                  )}
                  {debugInfo.sessionState.expiresAt && (
                    <div>Expires At: {new Date(debugInfo.sessionState.expiresAt).toLocaleString()}</div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="text-sm font-medium">Auth Store</CardHeader>
                <CardContent className="text-xs space-y-1">
                  <div>Is Authenticated: {debugInfo.authStore.isAuthenticated ? 'Yes' : 'No'}</div>
                  <div>Is Session Valid: {debugInfo.authStore.isSessionValid ? 'Yes' : 'No'}</div>
                  <div>Is Session Expiring: {debugInfo.authStore.isSessionExpiring ? 'Yes' : 'No'}</div>
                  <div>Refresh Attempts: {debugInfo.authStore.refreshAttempts}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="text-sm font-medium">LocalStorage</CardHeader>
                <CardContent className="text-xs space-y-1">
                  <div>Available: {debugInfo.localStorage.available ? 'Yes' : 'No'}</div>
                  <div>Nexus Auth Session: {debugInfo.localStorage.nexusAuthSession ? 'Present' : 'Missing'}</div>
                  <div>Supabase Session: {debugInfo.localStorage.supabaseSession ? 'Present' : 'Missing'}</div>
                  <div>Other Keys: {debugInfo.localStorage.otherKeys.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="text-sm font-medium">Supabase State</CardHeader>
                <CardContent className="text-xs space-y-1">
                  <div>Has Session: {debugInfo.supabaseState.hasSession ? 'Yes' : 'No'}</div>
                  {debugInfo.supabaseState.error && (
                    <div className="text-red-500">Error: {debugInfo.supabaseState.error}</div>
                  )}
                  {debugInfo.supabaseState.sessionData && (
                    <>
                      <div>User ID: {debugInfo.supabaseState.sessionData.userId}</div>
                      <div>Email: {debugInfo.supabaseState.sessionData.email}</div>
                      <div>Has Access Token: {debugInfo.supabaseState.sessionData.hasAccessToken ? 'Yes' : 'No'}</div>
                      <div>Has Refresh Token: {debugInfo.supabaseState.sessionData.hasRefreshToken ? 'Yes' : 'No'}</div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {refreshResult && (
              <Card>
                <CardHeader className="text-sm font-medium">Force Refresh Result</CardHeader>
                <CardContent className="text-xs">
                  <div>Success: {refreshResult.success ? 'Yes' : 'No'}</div>
                  {refreshResult.error && (
                    <div className="text-red-500">Error: {refreshResult.error}</div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 