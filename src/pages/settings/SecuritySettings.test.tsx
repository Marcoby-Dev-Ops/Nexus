import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { toast } from 'sonner';
import SecuritySettings from './SecuritySettings';
import * as passkeyUtils from '@/lib/utils/passkey';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { supabase } from '@/lib/core/supabase';
import { browserSupportsWebAuthn, startRegistration } from '@simplewebauthn/browser';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock dependencies
var mockTrack: jest.Mock;
jest.mock('sonner');
jest.mock('@/contexts/AuthContext');
jest.mock('@/contexts/NotificationContext');
jest.mock('@/lib/core/supabase', () => ({
  supabase: {
    auth: {
      updateUser: jest.fn(),
    },
  },
}));
jest.mock('@/lib/utils/passkey');
jest.mock('@simplewebauthn/browser');
jest.mock('./SecuritySettings', () => {
    const originalModule = jest.requireActual('./SecuritySettings');
    mockTrack = jest.fn();
    return {
        ...originalModule,
        analytics: {
            track: mockTrack,
        },
    };
});


const mockUseAuth = useAuth as jest.Mock;
const mockUseNotifications = useNotifications as jest.Mock;
const mockSupabase = supabase as jest.Mocked<typeof supabase>;
const mockBrowserSupportsWebAuthn = browserSupportsWebAuthn as jest.MockedFunction<typeof browserSupportsWebAuthn>;
const mockStartRegistration = startRegistration as jest.MockedFunction<typeof startRegistration>;
const mockToast = toast as jest.Mocked<typeof toast>;

const queryClient = new QueryClient();

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('SecuritySettings', () => {
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
        } as any);

        mockUseNotifications.mockReturnValue({
            addNotification: mockAddNotification,
            notifications: [],
            removeNotification: jest.fn(),
        } as any);

        mockBrowserSupportsWebAuthn.mockReturnValue(true);
        (passkeyUtils.fetchUserPasskeys as jest.Mock).mockResolvedValue([]);
        (passkeyUtils.deletePasskey as jest.Mock).mockResolvedValue(undefined);
        (passkeyUtils.registerPasskey as jest.Mock).mockResolvedValue(undefined);

        (supabase.auth.updateUser as jest.Mock).mockResolvedValue({ error: null });
    });

    describe('Password Change', () => {
        it('successfully changes the password and tracks analytics', async () => {
            render(<SecuritySettings />, { wrapper });
            fireEvent.change(screen.getByLabelText('New Password'), { target: { value: 'new-password-123' } });
            fireEvent.change(screen.getByLabelText('Confirm New Password'), { target: { value: 'new-password-123' } });
            fireEvent.click(screen.getByRole('button', { name: /update password/i }));
    
            await waitFor(() => {
                expect(supabase.auth.updateUser).toHaveBeenCalledWith({ password: 'new-password-123' });
                expect(mockTrack).toHaveBeenCalledWith('password_changed');
                expect(mockAddNotification).toHaveBeenCalledWith(expect.objectContaining({ type: 'success' }));
            });
        });
    
        it('tracks analytics on password change failure', async () => {
            (supabase.auth.updateUser as jest.Mock).mockResolvedValue({ error: { message: 'Update failed' } });
            render(<SecuritySettings />, { wrapper });
            fireEvent.change(screen.getByLabelText('New Password'), { target: { value: 'new-password-123' } });
            fireEvent.change(screen.getByLabelText('Confirm New Password'), { target: { value: 'new-password-123' } });
            fireEvent.click(screen.getByRole('button', { name: /update password/i }));
    
            await waitFor(() => {
                expect(mockTrack).toHaveBeenCalledWith('password_change_failed', { error: 'Update failed' });
            });
        });
    });
    
    describe('Two-Factor Authentication', () => {
        it('toggles 2FA and tracks analytics', () => {
            render(<SecuritySettings />, { wrapper });
            const twoFactorSwitch = screen.getByLabelText(/enable two-factor authentication/i);
            
            fireEvent.click(twoFactorSwitch);
            expect(mockTrack).toHaveBeenCalledWith('two_factor_toggled', { enabled: true });
            
            fireEvent.click(twoFactorSwitch);
            expect(mockTrack).toHaveBeenCalledWith('two_factor_toggled', { enabled: false });
        });
    });

    describe('Passkey Registration', () => {
        it('successfully registers a passkey and tracks analytics', async () => {
            render(<SecuritySettings />, { wrapper });
            
            fireEvent.click(screen.getByRole('button', { name: /add a passkey/i }));
            
            await waitFor(() => {
                fireEvent.change(screen.getByLabelText(/friendly name/i), { target: { value: 'My Test Key' } });
                fireEvent.click(screen.getByRole('button', { name: /register passkey/i }));
            });
        
            await waitFor(() => {
                expect(passkeyUtils.registerPasskey).toHaveBeenCalled();
                expect(mockTrack).toHaveBeenCalledWith('passkey_registered', { friendly_name: 'My Test Key' });
            });
        });
    
        it('tracks analytics on passkey registration failure', async () => {
            (passkeyUtils.registerPasskey as jest.Mock).mockRejectedValue(new Error('Registration failed'));
            render(<SecuritySettings />, { wrapper });
            
            fireEvent.click(screen.getByRole('button', { name: /add a passkey/i }));
            
            await waitFor(() => {
                fireEvent.click(screen.getByRole('button', { name: /register passkey/i }));
            });
    
            await waitFor(() => {
                expect(mockTrack).toHaveBeenCalledWith('passkey_registration_failed', { error: 'Registration failed' });
            });
        });
    });

    describe('Passkey Deletion', () => {
        it('deletes a passkey and tracks analytics', async () => {
            (passkeyUtils.fetchUserPasskeys as jest.Mock).mockResolvedValue([{ credentialID: 'cred-123', friendlyName: 'Test Key' }]);
            render(<SecuritySettings />, { wrapper });
            
            await waitFor(() => {
                const deleteButton = screen.getByRole('button', { name: /delete passkey/i });
                fireEvent.click(deleteButton);
            });
    
            await waitFor(() => {
                expect(passkeyUtils.deletePasskey).toHaveBeenCalledWith('cred-123');
                expect(mockTrack).toHaveBeenCalledWith('passkey_deleted', { credential_id: 'cred-123' });
            });
        });
    
        it('tracks analytics on passkey deletion failure', async () => {
            (passkeyUtils.fetchUserPasskeys as jest.Mock).mockResolvedValue([{ credentialID: 'cred-123', friendlyName: 'Test Key' }]);
            (passkeyUtils.deletePasskey as jest.Mock).mockRejectedValue(new Error('Deletion failed'));
            render(<SecuritySettings />, { wrapper });
    
            await waitFor(() => {
                const deleteButton = screen.getByRole('button', { name: /delete passkey/i });
                fireEvent.click(deleteButton);
            });
    
            await waitFor(() => {
                expect(mockTrack).toHaveBeenCalledWith('passkey_deletion_failed', { credential_id: 'cred-123', error: 'Deletion failed' });
            });
        });
    });
}); 