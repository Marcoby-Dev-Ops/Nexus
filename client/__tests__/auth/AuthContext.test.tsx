import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';

// Create mock functions
const mockGetSession = jest.fn();
const mockSignIn = jest.fn();
const mockSignUp = jest.fn();
const mockSignOut = jest.fn();

// Mock the entire auth module
jest.mock('@/core/auth', () => ({
  authService: {
    signIn: mockSignIn,
    signUp: mockSignUp,
    signOut: mockSignOut,
    getSession: mockGetSession,
  },
}));

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

// Import the mocked modules
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

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
    
    // Mock authService methods with correct ServiceResponse structure
    mockGetSession.mockResolvedValue({
      data: null,
      error: null,
      success: true,
    });
    
    mockSignIn.mockResolvedValue({ 
      data: null, 
      error: null, 
      success: true 
    });
    mockSignUp.mockResolvedValue({ 
      data: null, 
      error: null, 
      success: true 
    });
    mockSignOut.mockResolvedValue({ 
      data: true, 
      error: null, 
      success: true 
    });
    
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

  it('should handle session retrieval error', async () => {
    mockGetSession.mockResolvedValue({
      data: null,
      error: 'Session error',
      success: false,
    });

    render(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('no-user');
      expect(screen.getByTestId('error')).toHaveTextContent('Session error');
    });
  });

  it('should cleanup on unmount', async () => {
    const { unmount } = render(<TestComponent />);
    
    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId('initialized')).toHaveTextContent('initialized');
    });
    
    // Unmount should not cause errors
    unmount();
  });
}); 