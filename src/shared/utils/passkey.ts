import { browserSupportsWebAuthn, startRegistration, startAuthentication } from '@simplewebauthn/browser';
import { supabase } from "@/lib/supabase";
import { toast } from 'sonner';
import { select, insertOne, updateOne, deleteOne } from '@/lib/supabase';
import { logger } from '@/shared/utils/logger';

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
 * Register a new passkey for the user
 */
export async function registerPasskey(options: PasskeyRegistrationOptions): Promise<void> {
  if (!isPasskeySupported()) {
    throw new Error('Your browser does not support passkeys');
  }

  // Ensure we have a valid session
  const { data: { session } } = await sessionUtils.getSession();
  if (!session) {
    throw new Error('No Supabase session found – please re-login.');
  }

  // Step 1: Get registration challenge from server
  const challengeOptions = await callEdgeFunction('passkey-register-challenge', {
    userId: options.userId, 
    friendlyName: options.friendlyName?.trim() || undefined 
  });
  
  if (!challengeOptions) {
    throw new Error('Failed to get registration challenge');
  }

  // Step 2: Start browser-native WebAuthn registration flow
  const attestationResponse = await startRegistration({ optionsJSON: challengeOptions });

  // Step 3: Verify and persist on the backend
  await callEdgeFunction('passkey-register-verify', {
    userId: options.userId, 
    attestationResponse,
    friendlyName: options.friendlyName?.trim() || undefined
  });
}

/**
 * Authenticate using a passkey
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

  // Step 1: Get authentication challenge from server
  const challengeData = await callEdgeFunction('passkey-auth-challenge', { 
    email: options.email 
  });
  
  if (!challengeData) {
    throw new Error('Failed to get authentication challenge');
  }

  const { userId } = challengeData;

  // Step 2: Browser authentication prompt
  const assertionResponse = await startAuthentication({ optionsJSON: publicKeyOptions });

  // Step 3: Verify on server
  const verifyRes = await callEdgeFunction('passkey-auth-verify', { 
    userId, 
    assertionResponse 
  });
  
  if (!verifyRes) {
    throw new Error('Failed to verify passkey authentication');
  }

  return verifyRes;
}

/**
 * Fetch all passkeys for the current user
 */
export async function fetchUserPasskeys(): Promise<PasskeyRecord[]> {
  const { data, error } = await select('ai_passkeys', 'credential_id, friendly_name, created_at, device_type', {}, {
    orderBy: { column: 'created_at', ascending: false }
  });
  
  if (error) {
    logger.error('[Passkey] Failed to fetch passkeys', { error });
    throw new Error('Failed to load passkeys');
  }
  
  return data || [];
}

/**
 * Delete a passkey by credential ID
 */
export async function deletePasskey(credentialId: string): Promise<void> {
  const { error } = await deleteOne('ai_passkeys', credentialId, 'credential_id');
  
  if (error) {
    throw new Error(error.message || 'Failed to delete passkey');
  }
}

/**
 * Establish a Supabase session after successful passkey authentication
 */
export async function establishPasskeySession(authResult: {
  verified: boolean;
  access_token?: string;
  refresh_token?: string;
}): Promise<void> {
  if (!authResult.verified) {
    throw new Error('Passkey verification failed');
  }

  if (authResult.access_token && authResult.refresh_token) {
    // Set session with returned tokens
    const { error: sessionErr } = await sessionUtils.setSession({
      access_token: authResult.access_token,
      refresh_token: authResult.refresh_token,
    });
    
    if (sessionErr) {
      throw new Error(sessionErr.message || 'Failed to establish session');
    }
  } else {
    // Fallback: attempt to refresh session
    const { error: refreshErr } = await sessionUtils.refreshSession();
    if (refreshErr) {
      throw new Error('Failed to establish session after passkey authentication');
    }
  }
}

/**
 * Helper to show appropriate error messages for passkey operations
 */
export function handlePasskeyError(error: unknown, operation: 'registration' | 'authentication'): void {
  const errorMessage = error instanceof Error ? error.message: `Passkey ${operation} failed`;
  
  // Handle specific error cases
  if (errorMessage.includes('User cancelled') || errorMessage.includes('NotAllowedError')) {
    toast.error(`Passkey ${operation} was cancelled`);
  } else if (errorMessage.includes('not supported')) {
    toast.error('Your browser does not support passkeys');
  } else if (errorMessage.includes('timeout')) {
    toast.error(`Passkey ${operation} timed out. Please try again.`);
  } else {
    toast.error(errorMessage);
  }
  
   
     
    // eslint-disable-next-line no-console
    console.error(`[Passkey] ${operation} failed: `, error);
}

/**
 * Handle successful passkey authentication with redirect
 */
export function handlePasskeySignInSuccess(
  redirectTo?: string, 
  onSuccess?: () => void
): void {
  // Show success message
  toast.success('Welcome back! Signed in with passkey.');
  
  // Call custom success callback if provided
  if (onSuccess) {
    onSuccess();
    return;
  }
  
  // Fallback redirect logic
  const targetPath = redirectTo || '/home';
  
  // Use window.location for reliable navigation
  if (typeof window !== 'undefined') {
    window.location.href = targetPath;
  }
}

/**
 * Handle successful passkey registration with UI feedback
 */
export function handlePasskeyRegistrationSuccess(): void {
  toast.success('Passkey added successfully! You can now sign in securely.');
}

/**
 * Complete passkey sign-in flow with session establishment and redirect
 */
export async function handleCompletePasskeySignIn(
  email: string,
  redirectTo?: string,
  onSuccess?: () => void
): Promise<void> {
  try {
    // Authenticate with passkey
    const authResult = await authenticateWithPasskey({ email });
    
    if (!authResult.verified) {
      throw new Error('Passkey verification failed');
    }
    
    // Establish session
    await establishPasskeySession(authResult);
    
    // Handle success with redirect
    handlePasskeySignInSuccess(redirectTo, onSuccess);
    
  } catch (error) {
    handlePasskeyError(error, 'authentication');
    throw error; // Re-throw for caller to handle if needed
  }
} 

export const getPasskeys = async (userId: string) => {
  try {
    const { data, error } = await select('user_passkeys', '*', { user_id: userId });
    if (error) {
      logger.error({ error }, 'Failed to fetch passkeys');
      return [];
    }
    return data || [];
  } catch (err) {
    logger.error({ err }, 'Error fetching passkeys');
    return [];
  }
};

export const addPasskey = async (userId: string, passkey: any) => {
  try {
    const { data, error } = await insertOne('user_passkeys', { ...passkey, user_id: userId });
    if (error) {
      logger.error({ error }, 'Failed to add passkey');
      return null;
    }
    return data;
  } catch (err) {
    logger.error({ err }, 'Error adding passkey');
    return null;
  }
};

export const updatePasskey = async (id: string, updates: any) => {
  try {
    const { data, error } = await updateOne('user_passkeys', id, updates);
    if (error) {
      logger.error({ error }, 'Failed to update passkey');
      return null;
    }
    return data;
  } catch (err) {
    logger.error({ err }, 'Error updating passkey');
    return null;
  }
}; 