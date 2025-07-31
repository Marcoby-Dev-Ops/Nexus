import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useAuth } from '../../src/hooks/useAuth';
import { supabase } from '../../src/lib/supabase';

// Mock services to avoid import.meta issues
jest.mock('../../src/services', () => ({
  authService: {
    signIn: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    getSession: jest.fn(),
  },
}));

// Mock Supabase
jest.mock('../../src/lib/supabase', () => ({
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

const mockSupabase = supabase as typeof supabase & {
  auth: {
    getSession: jest.Mock;
    onAuthStateChange: jest.Mock;
    signInWithPassword: jest.Mock;
    signUp: jest.Mock;
    signOut: jest.Mock;
    resetPasswordForEmail: jest.Mock;
  };
  from: jest.Mock;
};

// Import the mocked authService
import { authService } from '../../src/services';
const mockAuthService = authService as jest.Mocked<typeof authService>;

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

describe('useAuth Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock authService methods
    mockAuthService.getSession.mockResolvedValue({
      session: null,
      error: null,
    });
    
    mockAuthService.signIn.mockResolvedValue({ error: null });
    mockAuthService.signUp.mockResolvedValue({ error: null });
    mockAuthService.signOut.mockResolvedValue({ error: null });
    
    // Mock Supabase auth state change
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
    render(<TestComponent />);

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

    mockAuthService.getSession.mockResolvedValue({
      session: mockSession,
      error: null,
    });

    render(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
      expect(screen.getByTestId('initialized')).toHaveTextContent('initialized');
    });
  });

  it('should handle session errors gracefully', async () => {
    const error = new Error('Session error');
    mockAuthService.getSession.mockResolvedValue({
      session: null,
      error: error,
    });

    render(<TestComponent />);

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

    const { unmount } = render(<TestComponent />);

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
    mockAuthService.getSession.mockImplementation(
      () => new Promise((resolve) => {
        setTimeout(() => resolve({ session: null, error: null }), 15000);
      })
    );

    // Reduce timeout for testing
    jest.useFakeTimers();

    render(<TestComponent />);

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
    mockAuthService.getSession.mockImplementation(() => {
      resolveCount++;
      return Promise.resolve({ session: null, error: null });
    });

    const { rerender } = render(<TestComponent />);

    // Try to trigger multiple auth changes quickly
    rerender(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('initialized')).toHaveTextContent('initialized');
    });

    // Should only call getSession once despite multiple rerenders
    expect(resolveCount).toBe(1);
  });
}); 