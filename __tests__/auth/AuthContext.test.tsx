import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/core/supabase';

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      resetPasswordForEmail: jest.fn(),
    },
    from: jest.fn(),
  },
}));

const mockSupabase = supabase as jest.Mocked<typeof supabase>;

// Test component that uses auth
const TestComponent = () => {
  const { user, loading, error, initialized } = useAuth();
  
  return (
    <div>
      <div data-testid="loading">{loading ? 'loading' : 'not-loading'}</div>
      <div data-testid="initialized">{initialized ? 'initialized' : 'not-initialized'}</div>
      <div data-testid="user">{user ? user.email : 'no-user'}</div>
      <div data-testid="error">{error ? error.message : 'no-error'}</div>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful session
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });
    
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    });
    
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    } as any);
  });

  it('should initialize with loading state', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Should start loading
    expect(screen.getByTestId('loading')).toHaveTextContent('loading');
    expect(screen.getByTestId('initialized')).toHaveTextContent('not-initialized');
    
    // Wait for initialization
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      expect(screen.getByTestId('initialized')).toHaveTextContent('initialized');
    });
  });

  it('should handle auth session correctly', async () => {
    const mockSession = {
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        created_at: '2023-01-01T00:00:00Z',
        user_metadata: { full_name: 'Test User' },
      },
    };

    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
      expect(screen.getByTestId('initialized')).toHaveTextContent('initialized');
    });
  });

  it('should handle session errors gracefully', async () => {
    const error = new Error('Session error');
    mockSupabase.auth.getSession.mockRejectedValue(error);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Session error');
      expect(screen.getByTestId('initialized')).toHaveTextContent('initialized');
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
    });
  });

  it('should cleanup on unmount', async () => {
    const unsubscribeMock = jest.fn();
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: unsubscribeMock } },
    });

    const { unmount } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Wait for initialization
    await waitFor(() => {
      expect(screen.getByTestId('initialized')).toHaveTextContent('initialized');
    });

    // Unmount component
    unmount();

    // Should call unsubscribe
    expect(unsubscribeMock).toHaveBeenCalled();
  });

  it('should handle timeout properly', async () => {
    // Mock a slow response
    mockSupabase.auth.getSession.mockImplementation(
      () => new Promise((resolve) => {
        setTimeout(() => resolve({ data: { session: null }, error: null }), 15000);
      })
    );

    // Reduce timeout for testing
    jest.useFakeTimers();

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Fast-forward time to trigger timeout
    act(() => {
      jest.advanceTimersByTime(11000);
    });

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Authentication timeout');
      expect(screen.getByTestId('initialized')).toHaveTextContent('initialized');
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
    });

    jest.useRealTimers();
  });

  it('should prevent multiple simultaneous auth changes', async () => {
    let resolveCount = 0;
    mockSupabase.auth.getSession.mockImplementation(() => {
      resolveCount++;
      return Promise.resolve({ data: { session: null }, error: null });
    });

    const { rerender } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Try to trigger multiple auth changes quickly
    rerender(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('initialized')).toHaveTextContent('initialized');
    });

    // Should only call getSession once despite multiple rerenders
    expect(resolveCount).toBe(1);
  });
}); 