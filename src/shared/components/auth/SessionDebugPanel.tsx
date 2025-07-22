import React, { useState, useEffect } from 'react';
import { Button } from '@/shared/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { 
  RefreshCw, 
  Trash2, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  Info,
  X
} from 'lucide-react';
import { 
  getSessionDebugInfo, 
  clearAllSessionStorage, 
  forceRefreshSession
} from '@/shared/utils/sessionDebug';

interface SessionDebugPanelProps {
  className?: string;
}

export const SessionDebugPanel: React.FC<SessionDebugPanelProps> = ({ 
  className = '' 
}) => {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const refreshDebugInfo = async () => {
    setLoading(true);
    try {
      const info = await getSessionDebugInfo();
      setDebugInfo(info);
    } catch (error) {
      console.error('Failed to get debug info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearStorage = async () => {
    setLoading(true);
    try {
      clearAllSessionStorage();
      await refreshDebugInfo();
    } catch (error) {
      console.error('Failed to clear storage:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleForceRefresh = async () => {
    setLoading(true);
    try {
      const success = await forceRefreshSession();
      if (success) {
        await refreshDebugInfo();
      }
    } catch (error) {
      console.error('Failed to force refresh session:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isVisible) {
      refreshDebugInfo();
    }
  }, [isVisible]);

  // Only show in development
  if (!import.meta.env.DEV) {
    return null;
  }

  if (!isVisible) {
    return (
      <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsVisible(true)}
          className="bg-background/80 backdrop-blur-sm"
        >
          <Info className="w-4 h-4 mr-2" />
          Debug Session
        </Button>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 w-96 ${className}`}>
      <Card className="bg-background/95 backdrop-blur-sm border-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Session Debug Panel</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status Overview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Storage Available:</span>
              <div className="flex gap-2">
                <Badge variant={debugInfo?.hasLocalStorage ? "default" : "destructive"} className="text-xs">
                  localStorage
                </Badge>
                <Badge variant={debugInfo?.hasSessionStorage ? "default" : "destructive"} className="text-xs">
                  sessionStorage
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Session Status:</span>
              <div className="flex items-center gap-1">
                {debugInfo?.supabaseSession ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-500" />
                )}
                <span className="text-xs">
                  {debugInfo?.supabaseSession ? 'Active' : 'None'}
                </span>
              </div>
            </div>
            
            {debugInfo?.sessionExpiry && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Expiry:</span>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span className="text-xs">
                    {debugInfo.isExpired ? 'Expired' : `${Math.round(debugInfo.timeUntilExpiry / 1000)}s`}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refreshDebugInfo}
              disabled={loading}
              className="flex-1"
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleForceRefresh}
              disabled={loading}
              className="flex-1"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Force Refresh
            </Button>
            
            <Button
              variant="destructive"
              size="sm"
              onClick={handleClearStorage}
              disabled={loading}
              className="flex-1"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Clear
            </Button>
          </div>

          {/* Detailed Info (Collapsible) */}
          <details className="text-xs">
            <summary className="cursor-pointer font-medium mb-2">
              Detailed Information
            </summary>
            <div className="space-y-2 text-xs">
              {debugInfo?.storedSession && (
                <div>
                  <strong>Stored Session:</strong>
                  <pre className="bg-muted p-2 rounded mt-1 overflow-auto max-h-20">
                    {JSON.stringify(debugInfo.storedSession, null, 2)}
                  </pre>
                </div>
              )}
              
              {debugInfo?.supabaseSession && (
                <div>
                  <strong>Supabase Session:</strong>
                  <pre className="bg-muted p-2 rounded mt-1 overflow-auto max-h-20">
                    {JSON.stringify(debugInfo.supabaseSession, null, 2)}
                  </pre>
                </div>
              )}
              
              {debugInfo?.errors.length > 0 && (
                <div>
                  <strong className="text-destructive">Errors:</strong>
                  <ul className="list-disc list-inside mt-1 text-destructive">
                    {debugInfo.errors.map((error: string, index: number) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </details>
        </CardContent>
      </Card>
    </div>
  );
}; 