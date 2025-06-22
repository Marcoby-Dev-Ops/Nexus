import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { toast } from 'sonner';
import SecuritySettings from '../../../src/pages/settings/SecuritySettings';
import { useAuth } from '../../../src/contexts/AuthContext';
import { useNotifications } from '../../../src/contexts/NotificationContext';
import { supabase } from '../../../src/lib/supabase';
import { browserSupportsWebAuthn, startRegistration } from '@simplewebauthn/browser';

// Mock dependencies
jest.mock('sonner');
jest.mock('../../../src/contexts/AuthContext');
jest.mock('../../../src/contexts/NotificationContext');
jest.mock('../../../src/lib/supabase');
jest.mock('@simplewebauthn/browser');

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseNotifications = useNotifications as jest.MockedFunction<typeof useNotifications>;
const mockSupabase = supabase as jest.Mocked<typeof supabase>;
const mockBrowserSupportsWebAuthn = browserSupportsWebAuthn as jest.MockedFunction<typeof browserSupportsWebAuthn>;
const mockStartRegistration = startRegistration as jest.MockedFunction<typeof startRegistration>;
const mockToast = toast as jest.Mocked<typeof toast>;

describe('SecuritySettings - Passkey Functionality', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
  };

  const mockAddNotification = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      signOut: jest.fn(),
    });

    mockUseNotifications.mockReturnValue({
      addNotification: mockAddNotification,
      notifications: [],
      removeNotification: jest.fn(),
    });

    mockBrowserSupportsWebAuthn.mockReturnValue(true);

    // Mock Supabase client methods
    mockSupabase.from = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn(),
        }),
      }),
      delete: jest.fn().mockReturnValue({
        eq: jest.fn(),
      }),
    });

    mockSupabase.auth = {
      getSession: jest.fn().mockResolvedValue({
        data: { session: { access_token: 'mock-token' } },
      }),
      updateUser: jest.fn(),
    } as any;

    mockSupabase.functions = {
      invoke: jest.fn(),
    } as any;
  });

  describe('Passkey Support Detection', () => {
    it('shows fallback banner when WebAuthn is not supported', () => {
      mockBrowserSupportsWebAuthn.mockReturnValue(false);
      
      render(<SecuritySettings />);
      
      expect(screen.getByText('Passkeys not supported')).toBeInTheDocument();
      expect(screen.getByText(/Your browser doesn't support passkeys/)).toBeInTheDocument();
    });

    it('disables add passkey button when WebAuthn is not supported', () => {
      mockBrowserSupportsWebAuthn.mockReturnValue(false);
      
      render(<SecuritySettings />);
      
      const addButton = screen.getByRole('button', { name: /add passkey/i });
      expect(addButton).toBeDisabled();
    });

    it('enables add passkey button when WebAuthn is supported', () => {
      mockBrowserSupportsWebAuthn.mockReturnValue(true);
      
      render(<SecuritySettings />);
      
      const addButton = screen.getByRole('button', { name: /add passkey/i });
      expect(addButton).not.toBeDisabled();
    });
  });

  describe('Passkey Registration', () => {
    beforeEach(() => {
      // Mock successful passkey fetch (empty list)
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      });
    });

    it('opens dialog when add passkey button is clicked', async () => {
      render(<SecuritySettings />);
      
      const addButton = screen.getByRole('button', { name: /add passkey/i });
      fireEvent.click(addButton);
      
      await waitFor(() => {
        expect(screen.getByText('Add New Passkey')).toBeInTheDocument();
        expect(screen.getByText(/Give your passkey a name/)).toBeInTheDocument();
      });
    });

    it('successfully registers a passkey with friendly name', async () => {
      const mockAttestationResponse = { id: 'test-credential-id' };
      
      mockSupabase.functions.invoke
        .mockResolvedValueOnce({
          data: { challenge: 'test-challenge' },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { verified: true },
          error: null,
        });

      mockStartRegistration.mockResolvedValue(mockAttestationResponse);

      render(<SecuritySettings />);
      
      // Open dialog
      const addButton = screen.getByRole('button', { name: /add passkey/i });
      fireEvent.click(addButton);
      
      await waitFor(() => {
        expect(screen.getByText('Add New Passkey')).toBeInTheDocument();
      });

      // Enter friendly name
      const nameInput = screen.getByLabelText(/passkey name/i);
      fireEvent.change(nameInput, { target: { value: 'MacBook Touch ID' } });

      // Click create passkey
      const createButton = screen.getByRole('button', { name: /create passkey/i });
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(mockSupabase.functions.invoke).toHaveBeenCalledWith(
          'passkey-register-challenge',
          {
            body: { userId: mockUser.id, friendlyName: 'MacBook Touch ID' },
            headers: { Authorization: 'Bearer mock-token' },
          }
        );
      });

      await waitFor(() => {
        expect(mockStartRegistration).toHaveBeenCalledWith({
          optionsJSON: { challenge: 'test-challenge' },
        });
      });

      await waitFor(() => {
        expect(mockSupabase.functions.invoke).toHaveBeenCalledWith(
          'passkey-register-verify',
          {
            body: {
              userId: mockUser.id,
              attestationResponse: mockAttestationResponse,
              friendlyName: 'MacBook Touch ID',
            },
          }
        );
      });

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('Passkey added successfully');
      });
    });

    it('handles registration errors gracefully', async () => {
      mockSupabase.functions.invoke.mockRejectedValue(new Error('Registration failed'));

      render(<SecuritySettings />);
      
      // Open dialog and attempt registration
      const addButton = screen.getByRole('button', { name: /add passkey/i });
      fireEvent.click(addButton);
      
      await waitFor(() => {
        expect(screen.getByText('Add New Passkey')).toBeInTheDocument();
      });

      const createButton = screen.getByRole('button', { name: /create passkey/i });
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Registration failed');
      });
    });

    it('shows error when user is not authenticated', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        signOut: jest.fn(),
      });

      render(<SecuritySettings />);
      
      const addButton = screen.getByRole('button', { name: /add passkey/i });
      fireEvent.click(addButton);
      
      await waitFor(() => {
        expect(screen.getByText('Add New Passkey')).toBeInTheDocument();
      });

      const createButton = screen.getByRole('button', { name: /create passkey/i });
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('You must be signed in to register a passkey');
      });
    });
  });

  describe('Passkey Management', () => {
    const mockPasskeys = [
      {
        credential_id: 'test-cred-1',
        friendly_name: 'MacBook Touch ID',
        created_at: '2024-01-01T00:00:00Z',
        device_type: 'multi_device',
      },
      {
        credential_id: 'test-cred-2',
        friendly_name: null,
        created_at: '2024-01-02T00:00:00Z',
        device_type: 'single_device',
      },
    ];

    beforeEach(() => {
      // Mock passkey fetch with existing passkeys
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: mockPasskeys,
            error: null,
          }),
        }),
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      });
    });

    it('displays existing passkeys correctly', async () => {
      render(<SecuritySettings />);

      await waitFor(() => {
        expect(screen.getByText('MacBook Touch ID')).toBeInTheDocument();
        expect(screen.getByText('Unnamed Passkey')).toBeInTheDocument();
        expect(screen.getByText('Multi-device')).toBeInTheDocument();
        expect(screen.getByText('Single-device')).toBeInTheDocument();
      });
    });

    it('successfully deletes a passkey', async () => {
      render(<SecuritySettings />);

      await waitFor(() => {
        expect(screen.getByText('MacBook Touch ID')).toBeInTheDocument();
      });

      // Find and click delete button for first passkey
      const deleteButtons = screen.getAllByRole('button', { name: '' }); // Trash icon buttons
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledWith('ai_passkeys');
      });

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('Passkey deleted successfully');
      });
    });

    it('handles deletion errors gracefully', async () => {
      // Mock deletion error
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: mockPasskeys,
            error: null,
          }),
        }),
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockRejectedValue(new Error('Deletion failed')),
        }),
      });

      render(<SecuritySettings />);

      await waitFor(() => {
        expect(screen.getByText('MacBook Touch ID')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole('button', { name: '' });
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Deletion failed');
      });
    });
  });

  describe('Password Change Functionality', () => {
    it('successfully updates password', async () => {
      mockSupabase.auth.updateUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      render(<SecuritySettings />);

      // Fill in password form
      fireEvent.change(screen.getByLabelText(/current password/i), {
        target: { value: 'oldpassword' },
      });
      fireEvent.change(screen.getByLabelText(/new password/i), {
        target: { value: 'NewPassword123' },
      });
      fireEvent.change(screen.getByLabelText(/confirm new password/i), {
        target: { value: 'NewPassword123' },
      });

      // Submit form
      const updateButton = screen.getByRole('button', { name: /update password/i });
      fireEvent.click(updateButton);

      await waitFor(() => {
        expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
          password: 'NewPassword123',
        });
      });

      await waitFor(() => {
        expect(mockAddNotification).toHaveBeenCalledWith({
          message: 'Password updated successfully',
          type: 'success',
        });
      });
    });

    it('validates password requirements', () => {
      render(<SecuritySettings />);

      const newPasswordInput = screen.getByLabelText(/new password/i);
      
      // Test weak password
      fireEvent.change(newPasswordInput, { target: { value: 'weak' } });
      
      // Check validation indicators
      expect(screen.getByText('• At least 8 characters')).toHaveClass('text-muted-foreground');
      expect(screen.getByText('• At least 1 uppercase letter')).toHaveClass('text-muted-foreground');
      expect(screen.getByText('• At least 1 number')).toHaveClass('text-muted-foreground');

      // Test strong password
      fireEvent.change(newPasswordInput, { target: { value: 'StrongPassword123' } });
      
      expect(screen.getByText('• At least 8 characters')).toHaveClass('text-green-500');
      expect(screen.getByText('• At least 1 uppercase letter')).toHaveClass('text-green-500');
      expect(screen.getByText('• At least 1 number')).toHaveClass('text-green-500');
    });
  });
}); 