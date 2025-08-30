import { browserSupportsWebAuthn, startRegistration, startAuthentication } from '@simplewebauthn/browser';
import { toast } from 'sonner';
import { logger } from '@/shared/utils/logger';
import { authentikAuthService } from '@/core/auth/authentikAuthServiceInstance';

export interface PasskeyRegistrationOptions {
  userId: string;
  friendlyName?: string;
}

export interface PasskeyAuthenticationOptions {
  email: string;
}

export interface PasskeyRecord {
  credentialid: string;
  friendlyname: string | null;
  createdat: string;
  devicetype: 'single_device' | 'multi_device';
}

/**
 * Check if the current browser supports WebAuthn/Passkeys
 */
export function isPasskeySupported(): boolean {
  return Boolean(browserSupportsWebAuthn());
}

/**
 * Register a new passkey for the user with Authentik
 */
export async function registerPasskey(options: PasskeyRegistrationOptions): Promise<void> {
  if (!isPasskeySupported()) {
    throw new Error('Your browser does not support passkeys');
  }

  try {
    // Ensure we have a valid Authentik session
    const sessionResult = await authentikAuthService.getSession();
    if (!sessionResult.success || !sessionResult.data) {
      throw new Error('No valid Authentik session found – please re-login.');
    }

    // Step 1: Get registration challenge from Authentik
    const challengeResponse = await fetch(`${import.meta.env.VITE_AUTHENTIK_URL}/api/v3/authenticators/webauthn/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionResult.data.session.accessToken}`,
      },
      body: JSON.stringify({
        name: options.friendlyName || 'Passkey',
        type: 'webauthn',
        user: options.userId,
      }),
    });

    if (!challengeResponse.ok) {
      throw new Error('Failed to get registration challenge from Authentik');
    }

    const challengeData = await challengeResponse.json();
    
    // Step 2: Start browser-native WebAuthn registration flow
    const attestationResponse = await startRegistration({
      optionsJSON: challengeData.challenge,
    });

    // Step 3: Complete registration with Authentik
    const verifyResponse = await fetch(`${import.meta.env.VITE_AUTHENTIK_URL}/api/v3/authenticators/webauthn/`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionResult.data.session.accessToken}`,
      },
      body: JSON.stringify({
        id: challengeData.id,
        response: attestationResponse,
      }),
    });

    if (!verifyResponse.ok) {
      throw new Error('Failed to complete passkey registration with Authentik');
    }

    toast.success('Passkey registered successfully!');
    logger.info('Passkey registration completed', { userId: options.userId });

  } catch (error) {
    logger.error('Passkey registration failed', { error, userId: options.userId });
    toast.error('Failed to register passkey. Please try again.');
    throw error;
  }
}

/**
 * Authenticate using a passkey with Authentik
 */
export async function authenticateWithPasskey(options: PasskeyAuthenticationOptions): Promise<{
  verified: boolean;
  user?: { id: string; email: string };
  access_token?: string;
  refresh_token?: string;
}> {
  if (!isPasskeySupported()) {
    throw new Error('Your browser does not support passkeys');
  }

  try {
    // Step 1: Get authentication challenge from Authentik
    const challengeResponse = await fetch(`${import.meta.env.VITE_AUTHENTIK_URL}/api/v3/authenticators/webauthn/authenticate/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: options.email,
      }),
    });

    if (!challengeResponse.ok) {
      throw new Error('Failed to get authentication challenge from Authentik');
    }

    const challengeData = await challengeResponse.json();

    // Step 2: Browser authentication prompt
    const assertionResponse = await startAuthentication({
      optionsJSON: challengeData.challenge,
    });

    // Step 3: Verify authentication with Authentik
    const verifyResponse = await fetch(`${import.meta.env.VITE_AUTHENTIK_URL}/api/v3/authenticators/webauthn/authenticate/`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        response: assertionResponse,
      }),
    });

    if (!verifyResponse.ok) {
      throw new Error('Failed to verify passkey authentication with Authentik');
    }

    const authResult = await verifyResponse.json();

    return {
      verified: true,
      user: authResult.user,
      access_token: authResult.access_token,
      refresh_token: authResult.refresh_token,
    };

  } catch (error) {
    logger.error('Passkey authentication failed', { error, email: options.email });
    return {
      verified: false,
    };
  }
}

/**
 * Get user's registered passkeys from Authentik
 */
export async function getUserPasskeys(): Promise<PasskeyRecord[]> {
  try {
    const sessionResult = await authentikAuthService.getSession();
    if (!sessionResult.success || !sessionResult.data) {
      throw new Error('No valid Authentik session found');
    }

    const response = await fetch(`${import.meta.env.VITE_AUTHENTIK_URL}/api/v3/authenticators/webauthn/`, {
      headers: {
        'Authorization': `Bearer ${sessionResult.data.session.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch passkeys from Authentik');
    }

    const passkeys = await response.json();
    
    return passkeys.results.map((passkey: any) => ({
      credentialid: passkey.credential_id,
      friendlyname: passkey.name,
      createdat: passkey.created_on,
      devicetype: passkey.type === 'webauthn' ? 'multi_device' : 'single_device',
    }));

  } catch (error) {
    logger.error('Failed to fetch user passkeys', { error });
    return [];
  }
}

/**
 * Delete a passkey from Authentik
 */
export async function deletePasskey(credentialId: string): Promise<boolean> {
  try {
    const sessionResult = await authentikAuthService.getSession();
    if (!sessionResult.success || !sessionResult.data) {
      throw new Error('No valid Authentik session found');
    }

    const response = await fetch(`${import.meta.env.VITE_AUTHENTIK_URL}/api/v3/authenticators/webauthn/${credentialId}/`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${sessionResult.data.session.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete passkey from Authentik');
    }

    toast.success('Passkey deleted successfully');
    logger.info('Passkey deleted', { credentialId });
    return true;

  } catch (error) {
    logger.error('Failed to delete passkey', { error, credentialId });
    toast.error('Failed to delete passkey');
    return false;
  }
}

/**
 * Check if user has any registered passkeys
 */
export async function hasPasskeys(): Promise<boolean> {
  const passkeys = await getUserPasskeys();
  return passkeys.length > 0;
}

/**
 * Get passkey registration status for the current user
 */
export async function getPasskeyStatus(): Promise<{
  hasPasskeys: boolean;
  passkeyCount: number;
  isSupported: boolean;
}> {
  const isSupported = isPasskeySupported();
  const passkeys = await getUserPasskeys();
  
  return {
    hasPasskeys: passkeys.length > 0,
    passkeyCount: passkeys.length,
    isSupported,
  };
}
