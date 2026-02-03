import type { Socket } from 'socket.io-client';
import { io } from 'socket.io-client';
import { useAuthStore } from '@/core/auth/authStore';

// Prefer same-origin in production (nginx can proxy websocket endpoints if needed).
const URL = import.meta.env.VITE_API_URL || '';

let socket: Socket | null = null;

export const getSocket = (): Socket | null => {
  // Get authentication token from auth store
  const getAuthToken = () => {
    try {
      const authStore = useAuthStore.getState();
      return authStore.session?.accessToken;
    } catch (error) {
      console.warn('Failed to get auth token for socket connection:', error);
    }
    return null;
  };

  const token = getAuthToken();
  
  // Only create socket if we have a valid token
  if (!token) {
    console.log('No auth token available for WebSocket connection');
    return null;
  }

  if (!socket) {
    socket = io(URL, {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      autoConnect: true,
      transports: ['websocket', 'polling'],
      auth: {
        token: token
      }
    });

    socket.on('connect', () => {
      console.log('Connected to WebSocket server:', socket?.id);
      
      // Subscribe to insights when connected
      socket?.emit('subscribe-insights', { userId: 'current' });
    });

    socket.on('disconnect', (reason) => {
      console.log('Disconnected from WebSocket server:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });

    // Handle authentication errors
    socket.on('auth_error', (error) => {
      console.error('Socket authentication error:', error);
      // Disconnect and clear socket to force reconnection with fresh token
      disconnectSocket();
    });
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const reconnectSocket = () => {
  disconnectSocket();
  return getSocket();
};

// Subscribe to auth store changes to reconnect socket when session updates
useAuthStore.subscribe((state) => {
  if (state.session && state.session.accessToken) {
    // If we have a valid session, ensure socket is connected
    if (!socket) {
      console.log('Auth session available, connecting WebSocket...');
      getSocket();
    } else {
      console.log('Auth session updated, reconnecting WebSocket...');
      reconnectSocket();
    }
  } else if (!state.session && socket) {
    // If session is cleared, disconnect socket
    console.log('Auth session cleared, disconnecting WebSocket...');
    disconnectSocket();
  }
});
