import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import LoginPage from '../LoginPage';

// Mock the auth hook
const mockSignIn = vi.fn();
const mockUseAuth = vi.fn(() => ({
  signIn: mockSignIn,
  loading: false,
}));

// Mock the redirect manager
const mockRedirectToDashboard = vi.fn();
const mockUseRedirectManager = vi.fn(() => ({
  redirectToDashboard: mockRedirectToDashboard,
}));

vi.mock('@/hooks/index', () => ({
  useAuth: mockUseAuth,
}));

vi.mock('@/shared/hooks/useRedirectManager.ts', () => ({
  useRedirectManager: mockUseRedirectManager,
}));

// Mock the toast hook
const mockToast = {
  toast: vi.fn(),
};

vi.mock('@/shared/components/ui/use-toast', () => ({
  useToast: () => mockToast,
}));

const renderLoginPage = () => {
  return render(
    <BrowserRouter>
      <LoginPage />
    </BrowserRouter>
  );
};

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSignIn.mockResolvedValue({ error: null });
  });

  it('should render all form fields', () => {
    renderLoginPage();

    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('should show validation errors for empty required fields', async () => {
    renderLoginPage();

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });

  it('should show validation error for invalid email', async () => {
    renderLoginPage();

    const emailInput = screen.getByLabelText(/email address/i);
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.blur(emailInput);

    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
    });
  });

  it('should submit form with valid data', async () => {
    renderLoginPage();

    // Fill in all required fields
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'password123' } });

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('john@example.com', 'password123');
    });
  });

  it('should show success message and redirect on successful login', async () => {
    renderLoginPage();

    // Fill in all required fields
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'password123' } });

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockToast.toast).toHaveBeenCalledWith({
        title: 'Success',
        description: 'Welcome back! Redirecting to dashboard...',
      });
      expect(mockRedirectToDashboard).toHaveBeenCalled();
    });
  });

  it('should show error message on login failure', async () => {
    const errorMessage = 'Invalid email or password';
    mockSignIn.mockResolvedValue({ error: errorMessage });

    renderLoginPage();

    // Fill in all required fields
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'wrongpassword' } });

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockToast.toast).toHaveBeenCalledWith({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    });
  });

  it('should disable form during submission', async () => {
    // Mock loading state
    mockUseAuth.mockReturnValue({
      signIn: mockSignIn,
      loading: true,
    });

    renderLoginPage();

    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole('button', { name: /signing in/i });

    expect(emailInput).toBeDisabled();
    expect(submitButton).toBeDisabled();
  });

  it('should show loading state during submission', async () => {
    let resolveSignIn: (value: any) => void;
    const signInPromise = new Promise((resolve) => {
      resolveSignIn = resolve;
    });

    mockSignIn.mockReturnValue(signInPromise);

    renderLoginPage();

    // Fill in all required fields
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'password123' } });

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitButton);

    // Should show loading state
    expect(screen.getByRole('button', { name: /signing in/i )).toBeInTheDocument();

    // Resolve the promise
    resolveSignIn!({ error: null });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /sign in/i )).toBeInTheDocument();
    });
  });

  it('should have proper accessibility attributes', () => {
    renderLoginPage();

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    expect(emailInput).toHaveAttribute('type', 'email');
    expect(emailInput).toHaveAttribute('autoComplete', 'email');
    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(passwordInput).toHaveAttribute('autoComplete', 'current-password');
    expect(submitButton).toHaveAttribute('type', 'submit');
  });

  it('should have links to password reset and signup', () => {
    renderLoginPage();

    const passwordResetLink = screen.getByRole('link', { name: /forgot your password/i });
    const signupLink = screen.getByRole('link', { name: /sign up/i });

    expect(passwordResetLink).toHaveAttribute('href', '/password-reset');
    expect(signupLink).toHaveAttribute('href', '/signup');
  });

  it('should log debug message in development mode', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    // Mock development environment
    vi.stubEnv('DEV', 'true');

    renderLoginPage();

    // Fill in all required fields
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'password123' } });

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('✅ Login successful, redirecting to dashboard');
    });

    consoleSpy.mockRestore();
    vi.unstubAllEnvs();
  });

  it('should not log debug message in production mode', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    // Mock production environment
    vi.stubEnv('DEV', 'false');

    renderLoginPage();

    // Fill in all required fields
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'password123' } });

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(consoleSpy).not.toHaveBeenCalledWith('✅ Login successful, redirecting to dashboard');
    });

    consoleSpy.mockRestore();
    vi.unstubAllEnvs();
  });
}); 