import { 
  isPasskeySupported, 
  registerPasskey, 
  authenticateWithPasskey, 
  fetchUserPasskeys, 
  deletePasskey, 
  establishPasskeySession,
  handlePasskeyError,
  PasskeyRegistrationOptions,
  PasskeyAuthenticationOptions 
} from '../../../src/lib/utils/passkey';
import { browserSupportsWebAuthn, startRegistration, startAuthentication } from '@simplewebauthn/browser';
import { supabase } from '../../../src/lib/supabase';
import { toast } from 'sonner';

// Mock dependencies
jest.mock('@simplewebauthn/browser');
jest.mock('../../../src/lib/supabase');
jest.mock('sonner');

const mockBrowserSupportsWebAuthn = browserSupportsWebAuthn as jest.MockedFunction<typeof browserSupportsWebAuthn>;
const mockStartRegistration = startRegistration as jest.MockedFunction<typeof startRegistration>;
const mockStartAuthentication = startAuthentication as jest.MockedFunction<typeof startAuthentication>;
const mockSupabase = supabase as jest.Mocked<typeof supabase>;
const mockToast = toast as jest.Mocked<typeof toast>;

describe('Passkey Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mocks
    mockSupabase.auth = {
      getSession: jest.fn(),
      setSession: jest.fn(),
      refreshSession: jest.fn(),
    } as any;

    mockSupabase.functions = {
      invoke: jest.fn(),
    } as any;

    mockSupabase.from = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        order: jest.fn().mockReturnValue({
          data: [],
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

  describe('isPasskeySupported', () => {
    it('should return true when browser supports WebAuthn', () => {
      mockBrowserSupportsWebAuthn.mockReturnValue(true);
      
      const result = isPasskeySupported();
      
      expect(result).toBe(true);
      expect(mockBrowserSupportsWebAuthn).toHaveBeenCalledTimes(1);
    });

    it('should return false when browser does not support WebAuthn', () => {
      mockBrowserSupportsWebAuthn.mockReturnValue(false);
      
      const result = isPasskeySupported();
      
      expect(result).toBe(false);
      expect(mockBrowserSupportsWebAuthn).toHaveBeenCalledTimes(1);
    });

    it('should handle undefined return value from browserSupportsWebAuthn', () => {
      mockBrowserSupportsWebAuthn.mockReturnValue(undefined as unknown as boolean);
      
      const result = isPasskeySupported();
      
      expect(result).toBe(false);
      expect(mockBrowserSupportsWebAuthn).toHaveBeenCalledTimes(1);
    });
  });

  describe('registerPasskey', () => {
    const mockOptions: PasskeyRegistrationOptions = {
      userId: 'test-user-id',
      friendlyName: 'Test Device',
    };

    beforeEach(() => {
      mockBrowserSupportsWebAuthn.mockReturnValue(true);
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { access_token: 'mock-token' } },
        error: null,
      });
    });

    it('successfully registers a passkey', async () => {
      const mockAttestationResponse = { id: 'test-credential' };
      
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

      await registerPasskey(mockOptions);

      expect(mockSupabase.functions.invoke).toHaveBeenCalledWith(
        'passkey-register-challenge',
        {
          body: { userId: 'test-user-id', friendlyName: 'Test Device' },
          headers: { Authorization: 'Bearer mock-token' },
        }
      );

      expect(mockStartRegistration).toHaveBeenCalledWith({
        optionsJSON: { challenge: 'test-challenge' },
      });

      expect(mockSupabase.functions.invoke).toHaveBeenCalledWith(
        'passkey-register-verify',
        {
          body: {
            userId: 'test-user-id',
            attestationResponse: mockAttestationResponse,
            friendlyName: 'Test Device',
          },
        }
      );
    });

    it('throws error when browser does not support WebAuthn', async () => {
      mockBrowserSupportsWebAuthn.mockReturnValue(false);

      await expect(registerPasskey(mockOptions)).rejects.toThrow(
        'Your browser does not support passkeys'
      );
    });

    it('throws error when no session is available', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      await expect(registerPasskey(mockOptions)).rejects.toThrow(
        'No Supabase session found – please re-login.'
      );
    });

    it('throws error when challenge request fails', async () => {
      mockSupabase.functions.invoke.mockResolvedValue({
        data: null,
        error: { message: 'Challenge failed' },
      });

      await expect(registerPasskey(mockOptions)).rejects.toThrow('Challenge failed');
    });

    it('throws error when verification fails', async () => {
      mockSupabase.functions.invoke
        .mockResolvedValueOnce({
          data: { challenge: 'test-challenge' },
          error: null,
        })
        .mockResolvedValueOnce({
          data: null,
          error: { message: 'Verification failed' },
        });

      mockStartRegistration.mockResolvedValue({ id: 'test-credential' });

      await expect(registerPasskey(mockOptions)).rejects.toThrow('Verification failed');
    });

    it('handles registration without friendly name', async () => {
      const optionsWithoutName: PasskeyRegistrationOptions = {
        userId: 'test-user-id',
      };

      mockSupabase.functions.invoke
        .mockResolvedValueOnce({
          data: { challenge: 'test-challenge' },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { verified: true },
          error: null,
        });

      mockStartRegistration.mockResolvedValue({ id: 'test-credential' });

      await registerPasskey(optionsWithoutName);

      expect(mockSupabase.functions.invoke).toHaveBeenCalledWith(
        'passkey-register-challenge',
        {
          body: { userId: 'test-user-id', friendlyName: undefined },
          headers: { Authorization: 'Bearer mock-token' },
        }
      );
    });
  });

  describe('authenticateWithPasskey', () => {
    const mockOptions: PasskeyAuthenticationOptions = {
      email: 'test@example.com',
    };

    beforeEach(() => {
      mockBrowserSupportsWebAuthn.mockReturnValue(true);
    });

    it('successfully authenticates with passkey', async () => {
      const mockAssertionResponse = { id: 'test-credential' };
      const mockVerifyResult = {
        verified: true,
        user: { id: 'user-id', email: 'test@example.com' },
        access_token: 'access-token',
        refresh_token: 'refresh-token',
      };

      mockSupabase.functions.invoke
        .mockResolvedValueOnce({
          data: {
            userId: 'user-id',
            challenge: 'auth-challenge',
            allowCredentials: [],
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: mockVerifyResult,
          error: null,
        });

      mockStartAuthentication.mockResolvedValue(mockAssertionResponse);

      const result = await authenticateWithPasskey(mockOptions);

      expect(result).toEqual(mockVerifyResult);

      expect(mockSupabase.functions.invoke).toHaveBeenCalledWith(
        'passkey-auth-challenge',
        { body: { email: 'test@example.com' } }
      );

      expect(mockStartAuthentication).toHaveBeenCalledWith({
        optionsJSON: { challenge: 'auth-challenge', allowCredentials: [] },
      });

      expect(mockSupabase.functions.invoke).toHaveBeenCalledWith(
        'passkey-auth-verify',
        { body: { userId: 'user-id', assertionResponse: mockAssertionResponse } }
      );
    });

    it('throws error when browser does not support WebAuthn', async () => {
      mockBrowserSupportsWebAuthn.mockReturnValue(false);

      await expect(authenticateWithPasskey(mockOptions)).rejects.toThrow(
        'Your browser does not support passkeys'
      );
    });

    it('throws error when challenge request fails', async () => {
      mockSupabase.functions.invoke.mockResolvedValue({
        data: null,
        error: { message: 'Challenge failed' },
      });

      await expect(authenticateWithPasskey(mockOptions)).rejects.toThrow('Challenge failed');
    });

    it('throws error when verification fails', async () => {
      mockSupabase.functions.invoke
        .mockResolvedValueOnce({
          data: { userId: 'user-id', challenge: 'challenge' },
          error: null,
        })
        .mockResolvedValueOnce({
          data: null,
          error: { message: 'Verification failed' },
        });

      mockStartAuthentication.mockResolvedValue({ id: 'test-credential' });

      await expect(authenticateWithPasskey(mockOptions)).rejects.toThrow('Verification failed');
    });
  });

  describe('fetchUserPasskeys', () => {
    it('successfully fetches passkeys', async () => {
      const mockPasskeys = [
        {
          credential_id: 'cred-1',
          friendly_name: 'Device 1',
          created_at: '2024-01-01T00:00:00Z',
          device_type: 'multi_device' as const,
        },
        {
          credential_id: 'cred-2',
          friendly_name: null,
          created_at: '2024-01-02T00:00:00Z',
          device_type: 'single_device' as const,
        },
      ];

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: mockPasskeys,
            error: null,
          }),
        }),
      });

      const result = await fetchUserPasskeys();

      expect(result).toEqual(mockPasskeys);
      expect(mockSupabase.from).toHaveBeenCalledWith('ai_passkeys');
    });

    it('throws error when fetch fails', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Fetch failed' },
          }),
        }),
      });

      await expect(fetchUserPasskeys()).rejects.toThrow('Failed to load passkeys');
    });

    it('returns empty array when no passkeys exist', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      });

      const result = await fetchUserPasskeys();

      expect(result).toEqual([]);
    });
  });

  describe('deletePasskey', () => {
    it('successfully deletes a passkey', async () => {
      await deletePasskey('test-credential-id');

      expect(mockSupabase.from).toHaveBeenCalledWith('ai_passkeys');
    });

    it('throws error when deletion fails', async () => {
      mockSupabase.from.mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Deletion failed' },
          }),
        }),
      });

      await expect(deletePasskey('test-credential-id')).rejects.toThrow('Deletion failed');
    });
  });

  describe('establishPasskeySession', () => {
    it('sets session with provided tokens', async () => {
      const authResult = {
        verified: true,
        access_token: 'access-token',
        refresh_token: 'refresh-token',
      };

      mockSupabase.auth.setSession.mockResolvedValue({
        data: { session: {} },
        error: null,
      });

      await establishPasskeySession(authResult);

      expect(mockSupabase.auth.setSession).toHaveBeenCalledWith({
        access_token: 'access-token',
        refresh_token: 'refresh-token',
      });
    });

    it('refreshes session when no tokens provided', async () => {
      const authResult = { verified: true };

      mockSupabase.auth.refreshSession.mockResolvedValue({
        data: { session: {} },
        error: null,
      });

      await establishPasskeySession(authResult);

      expect(mockSupabase.auth.refreshSession).toHaveBeenCalled();
    });

    it('throws error when verification failed', async () => {
      const authResult = { verified: false };

      await expect(establishPasskeySession(authResult)).rejects.toThrow(
        'Passkey verification failed'
      );
    });

    it('throws error when session establishment fails', async () => {
      const authResult = {
        verified: true,
        access_token: 'access-token',
        refresh_token: 'refresh-token',
      };

      mockSupabase.auth.setSession.mockResolvedValue({
        data: null,
        error: { message: 'Session failed' },
      });

      await expect(establishPasskeySession(authResult)).rejects.toThrow('Session failed');
    });
  });

  describe('handlePasskeyError', () => {
    beforeEach(() => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('handles user cancellation error', () => {
      const error = new Error('User cancelled');
      
      handlePasskeyError(error, 'registration');

      expect(mockToast.error).toHaveBeenCalledWith('Passkey registration was cancelled');
    });

    it('handles not supported error', () => {
      const error = new Error('not supported');
      
      handlePasskeyError(error, 'authentication');

      expect(mockToast.error).toHaveBeenCalledWith('Your browser does not support passkeys');
    });

    it('handles timeout error', () => {
      const error = new Error('timeout occurred');
      
      handlePasskeyError(error, 'registration');

      expect(mockToast.error).toHaveBeenCalledWith('Passkey registration timed out. Please try again.');
    });

    it('handles generic error', () => {
      const error = new Error('Generic error');
      
      handlePasskeyError(error, 'authentication');

      expect(mockToast.error).toHaveBeenCalledWith('Generic error');
    });

    it('handles non-Error objects', () => {
      const error = 'String error';
      
      handlePasskeyError(error, 'registration');

      expect(mockToast.error).toHaveBeenCalledWith('Passkey registration failed');
    });

    it('logs error to console', () => {
      const error = new Error('Test error');
      
      handlePasskeyError(error, 'registration');

      expect(console.error).toHaveBeenCalledWith('[Passkey] registration failed:', error);
    });
  });
}); 