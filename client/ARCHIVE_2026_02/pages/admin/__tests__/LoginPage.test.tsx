import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import LoginPage from '../LoginPage';

jest.mock('@/hooks/index', () => ({
  useAuth: jest.fn(() => ({
    signIn: jest.fn(),
    loading: false,
  })),
}));

jest.mock('@/shared/hooks/useRedirectManager.ts', () => ({
  useRedirectManager: jest.fn(() => ({
    redirectToDashboard: jest.fn(),
  })),
}));

jest.mock('@/shared/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

// Get the mocked functions
const mockUseAuth = jest.fn();
const mockSignIn = jest.fn();
const mockUseRedirectManager = jest.fn();
const mockRedirectToDashboard = jest.fn();
const mockToast = { toast: jest.fn() };

const renderLoginPage = () => {
  return render(
    <BrowserRouter>
      <LoginPage />
    </BrowserRouter>
  );
};

describe('LoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up the auth mock
    mockUseAuth.mockReturnValue({
      signIn: mockSignIn,
      loading: false,
      user: null,
    });
    
    // Set up the redirect manager mock
    mockUseRedirectManager.mockReturnValue({
      redirectToDashboard: mockRedirectToDashboard,
    });
    
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

  it('should show loading state during submission', async () => {
    mockUseAuth.mockReturnValue({
      signIn: mockSignIn,
      loading: true,
      user: null,
    });

    renderLoginPage();

    expect(screen.getByRole('button', { name: /signing in/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();
  });

  it('should show error message on login failure', async () => {
    const errorMessage = 'Invalid credentials';
    mockSignIn.mockResolvedValue({ error: errorMessage });

    renderLoginPage();

    // Fill in form
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'wrongpassword' } });

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('should have proper accessibility attributes', () => {
    renderLoginPage();

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    expect(emailInput).toHaveAttribute('type', 'email');
    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(submitButton).toHaveAttribute('type', 'submit');
  });

  it('should have links to password reset and signup', () => {
    renderLoginPage();

    const signupLink = screen.getByRole('link', { name: /sign up/i });
    expect(signupLink).toHaveAttribute('href', '/signup');
  });

  it('should disable form during submission', async () => {
    mockUseAuth.mockReturnValue({
      signIn: mockSignIn,
      loading: true,
      user: null,
    });

    renderLoginPage();

    const inputs = screen.getAllByRole('textbox');
    const passwordInputs = screen.getAllByDisplayValue('');

    // All inputs should be disabled during loading
    inputs.forEach(input => {
      expect(input).toBeDisabled();
    });

    passwordInputs.forEach(input => {
      if (input.getAttribute('type') === 'password') {
        expect(input).toBeDisabled();
      }
    });
  });

  it('should handle async login with proper error handling', async () => {
    let resolveSignIn: (value: any) => void;
    const signInPromise = new Promise((resolve) => {
      resolveSignIn = resolve;
    });

    mockSignIn.mockReturnValue(signInPromise);

    renderLoginPage();

    // Fill in form
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'password123' } });

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitButton);

    // Should show loading state
    expect(screen.getByRole('button', { name: /signing in/i })).toBeInTheDocument();

    // Resolve the promise
    resolveSignIn!({ error: null });

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('john@example.com', 'password123');
    });
  });

  it('should clear error when user starts typing', async () => {
    const errorMessage = 'Invalid credentials';
    mockSignIn.mockResolvedValue({ error: errorMessage });

    renderLoginPage();

    // Fill in form and submit to trigger error
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'wrongpassword' } });

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    // Start typing in email field
    const emailInput = screen.getByLabelText(/email address/i);
    fireEvent.change(emailInput, { target: { value: 'new@example.com' } });

    // Error should be cleared
    await waitFor(() => {
      expect(screen.queryByText(errorMessage)).not.toBeInTheDocument();
    });
  });

  it('should validate email format in real-time', async () => {
    renderLoginPage();

    const emailInput = screen.getByLabelText(/email address/i);

    // Test invalid email
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.blur(emailInput);

    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
    });

    // Test valid email
    fireEvent.change(emailInput, { target: { value: 'valid@example.com' } });
    fireEvent.blur(emailInput);

    await waitFor(() => {
      expect(screen.queryByText(/please enter a valid email address/i)).not.toBeInTheDocument();
    });
  });

  it('should show appropriate button text based on loading state', () => {
    // Not loading
    mockUseAuth.mockReturnValue({
      signIn: mockSignIn,
      loading: false,
      user: null,
    });

    const { rerender } = renderLoginPage();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();

    // Loading
    mockUseAuth.mockReturnValue({
      signIn: mockSignIn,
      loading: true,
      user: null,
    });

    rerender(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    expect(screen.getByRole('button', { name: /signing in/i })).toBeInTheDocument();
  });

  it('should handle network errors gracefully', async () => {
    mockSignIn.mockRejectedValue(new Error('Network error'));

    renderLoginPage();

    // Fill in form
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'password123' } });

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/an unexpected error occurred/i)).toBeInTheDocument();
    });
  });
}); 
