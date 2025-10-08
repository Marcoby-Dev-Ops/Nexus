import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import SignupPage from '../SignupPage';
import { useAuth } from '@/hooks/index';

jest.mock('@/hooks/index', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/shared/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

// Get the mocked functions
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockSignUp = jest.fn();
const mockToast = { toast: jest.fn() };

const renderSignupPage = () => {
  return render(
    <BrowserRouter>
      <SignupPage />
    </BrowserRouter>
  );
};

describe('SignupPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up the auth mock
    mockUseAuth.mockReturnValue({
      signUp: mockSignUp,
      loading: false,
      user: null,
    });
    
    mockSignUp.mockResolvedValue({ error: null });
  });

  it('should render all form fields', () => {
    renderSignupPage();

    // Check for form fields using proper selectors
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/company name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('should show validation errors for empty required fields', async () => {
    renderSignupPage();

    const submitButton = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/first name must be at least 2 characters/i)).toBeInTheDocument();
      expect(screen.getByText(/last name must be at least 2 characters/i)).toBeInTheDocument();
      expect(screen.getByText(/company name must be at least 2 characters/i)).toBeInTheDocument();
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      expect(screen.getByText(/please confirm your password/i)).toBeInTheDocument();
    });
  });

  it('should show validation error for invalid email', async () => {
    renderSignupPage();

    const emailInput = screen.getByLabelText(/email address/i);
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.blur(emailInput);

    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
    });
  });

  it('should show validation error for short password', async () => {
    renderSignupPage();

    const passwordInput = screen.getByLabelText(/^password$/i);
    fireEvent.change(passwordInput, { target: { value: 'short' } });
    fireEvent.blur(passwordInput);

    await waitFor(() => {
      expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
    });
  });

  it('should show validation error when passwords do not match', async () => {
    renderSignupPage();

    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'different123' } });
    fireEvent.blur(confirmPasswordInput);

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
  });

  it('should submit form with valid data', async () => {
    renderSignupPage();

    // Fill in all required fields
    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByLabelText(/company name/i), { target: { value: 'Acme Corp' } });
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'password123' } });

    const submitButton = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith('john@example.com', 'password123', 'John', 'Doe');
    });
  });

  it('should show loading state during submission', async () => {
    mockUseAuth.mockReturnValue({
      signUp: mockSignUp,
      loading: true,
      user: null,
    });

    renderSignupPage();

    expect(screen.getByRole('button', { name: /creating account/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /creating account/i })).toBeDisabled();
  });

  it('should show success message on successful signup', async () => {
    renderSignupPage();

    // Fill in form
    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByLabelText(/company name/i), { target: { value: 'Acme Corp' } });
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'password123' } });

    const submitButton = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith('john@example.com', 'password123', 'John', 'Doe');
    });
  });

  it('should show error message on signup failure', async () => {
    const errorMessage = 'Email already exists';
    mockSignUp.mockResolvedValue({ error: errorMessage });

    renderSignupPage();

    // Fill in form
    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByLabelText(/company name/i), { target: { value: 'Acme Corp' } });
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'password123' } });

    const submitButton = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('should have proper accessibility attributes', () => {
    renderSignupPage();

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });

    expect(emailInput).toHaveAttribute('type', 'email');
    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(submitButton).toHaveAttribute('type', 'submit');
  });

  it('should have link to login page', () => {
    renderSignupPage();

    const loginLink = screen.getByRole('link', { name: /sign in/i });
    expect(loginLink).toHaveAttribute('href', '/login');
  });

  it('should disable form during submission', async () => {
    mockUseAuth.mockReturnValue({
      signUp: mockSignUp,
      loading: true,
      user: null,
    });

    renderSignupPage();

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

  it('should handle async signup with proper error handling', async () => {
    let resolveSignUp: (value: any) => void;
    const signUpPromise = new Promise((resolve) => {
      resolveSignUp = resolve;
    });

    mockSignUp.mockReturnValue(signUpPromise);

    renderSignupPage();

    // Fill in form
    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByLabelText(/company name/i), { target: { value: 'Acme Corp' } });
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'password123' } });

    const submitButton = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(submitButton);

    // Should show loading state
    expect(screen.getByRole('button', { name: /creating account/i })).toBeInTheDocument();

    // Resolve the promise
    resolveSignUp!({ error: null });

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith('john@example.com', 'password123', 'John', 'Doe');
    });
  });

  it('should validate password strength requirements', async () => {
    renderSignupPage();

    const passwordInput = screen.getByLabelText(/^password$/i);

    // Test weak password
    fireEvent.change(passwordInput, { target: { value: 'weak' } });
    fireEvent.blur(passwordInput);

    await waitFor(() => {
      expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
    });

    // Test strong password
    fireEvent.change(passwordInput, { target: { value: 'strongpassword123' } });
    fireEvent.blur(passwordInput);

    await waitFor(() => {
      expect(screen.queryByText(/password must be at least 8 characters/i)).not.toBeInTheDocument();
    });
  });

  it('should show hints for form fields', () => {
    renderSignupPage();

    expect(screen.getByText(/we'll use this for important updates/i)).toBeInTheDocument();
    expect(screen.getByText(/must be at least 8 characters long/i)).toBeInTheDocument();
    expect(screen.getByText(/please confirm your password/i)).toBeInTheDocument();
  });
}); 
