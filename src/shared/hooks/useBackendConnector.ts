import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks';
import { selectData as select, selectOne } from '@/lib/api-client';
import { logger } from '@/shared/utils/logger';
import { ensureUserProfile } from '@/shared/utils/ensureUserProfile';

interface BackendStatus {
  connected: boolean;
  lastHeartbeat: string | null;
  latency: number | null;
  error: string | null;
}

interface BackendConnectorState {
  status: BackendStatus;
  isConnecting: boolean;
  reconnectAttempts: number;
}

export const useBackendConnector = () => {
  const { user } = useAuth();
  const [state, setState] = useState<BackendConnectorState>({
    status: {
      connected: false,
      lastHeartbeat: null,
      latency: null,
      error: null,
    },
    isConnecting: false,
    reconnectAttempts: 0,
  });

  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const checkConnection = useCallback(async () => {
    if (!user?.id) {
      logger.warn('useBackendConnector: No user ID available for connection check');
      return false;
    }

    // Additional validation to ensure user ID is valid
    if (user.id === 'undefined' || user.id === 'null' || !user.id.toString().trim()) {
      logger.warn('useBackendConnector: Invalid user ID for connection check', { userId: user.id });
      return false;
    }

    try {
      const startTime = Date.now();
      
      // Test connection by ensuring user profile exists
      const profile = await ensureUserProfile(user.id, user.email || '');
      
      const latency = Date.now() - startTime;
      
      if (!profile) {
        logger.error('Failed to ensure user profile exists');
        setState(prev => ({
          ...prev,
          status: {
            ...prev.status,
            connected: false,
            error: 'Failed to ensure user profile',
            latency,
          },
        }));
        return false;
      }

      setState(prev => ({
        ...prev,
        status: {
          connected: true,
          lastHeartbeat: new Date().toISOString(),
          latency,
          error: null,
        },
        reconnectAttempts: 0,
      }));
      
      return true;
    } catch (error) {
      logger.error({ error }, 'Backend connection test failed');
      setState(prev => ({
        ...prev,
        status: {
          ...prev.status,
          connected: false,
          error: 'Connection test failed',
        },
      }));
      return false;
    }
  }, [user?.id, user?.email]);

  const startHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }

    // Use longer intervals in development to reduce resource usage
    const heartbeatInterval = process.env.NODE_ENV === 'development' ? 60000 : 30000; // 1min dev, 30s prod
    heartbeatIntervalRef.current = setInterval(async () => {
      const isConnected = await checkConnection();
      
      if (!isConnected && state.reconnectAttempts < 5) {
        setState(prev => ({
          ...prev,
          reconnectAttempts: prev.reconnectAttempts + 1,
        }));
      }
    }, heartbeatInterval);
  }, [checkConnection, state.reconnectAttempts]);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  const connect = useCallback(async () => {
    if (!user?.id) {
      logger.warn('useBackendConnector: Cannot connect - no user ID available');
      return;
    }

    // Additional validation to ensure user ID is valid
    if (user.id === 'undefined' || user.id === 'null' || !user.id.toString().trim()) {
      logger.warn('useBackendConnector: Cannot connect - invalid user ID', { userId: user.id });
      return;
    }

    setState(prev => ({ ...prev, isConnecting: true }));
    
    try {
      const isConnected = await checkConnection();
      
      if (isConnected) {
        startHeartbeat();
      } else {
        // Schedule reconnect
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 5000);
      }
    } catch (error) {
      logger.error({ error }, 'Failed to connect to backend');
    } finally {
      setState(prev => ({ ...prev, isConnecting: false }));
    }
  }, [user?.id, checkConnection, startHeartbeat]);

  const disconnect = useCallback(() => {
    stopHeartbeat();
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    setState(prev => ({
      ...prev,
      status: {
        connected: false,
        lastHeartbeat: null,
        latency: null,
        error: null,
      },
      reconnectAttempts: 0,
    }));
  }, [stopHeartbeat]);

  useEffect(() => {
    if (user?.id) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [user?.id, connect, disconnect]);

  return {
    ...state,
    connect,
    disconnect,
    checkConnection,
  };
};
