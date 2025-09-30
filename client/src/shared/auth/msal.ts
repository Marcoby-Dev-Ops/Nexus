import { PublicClientApplication, type Configuration, type RedirectRequest } from '@azure/msal-browser';

// Use standardized Microsoft env variable names
const clientId = import.meta.env.VITE_MICROSOFT_CLIENT_ID as string | undefined;
const redirectUri = `${window.location.origin}/integrations/microsoft365/callback`;

export const msalConfig: Configuration = {
  auth: {
    clientId: clientId || '',
    authority: 'https://login.microsoftonline.com/common',
    redirectUri: redirectUri,
    navigateToLoginRequestUrl: false,
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: false,
    // Use a different cache key to avoid conflicts with Authentik
    cacheKey: 'msal_integration_cache',
  },
};

// Lazy initialization to avoid conflicts with Authentik
let _msalInstance: PublicClientApplication | null = null;

export const getMsalInstance = (): PublicClientApplication => {
  if (!_msalInstance) {
    _msalInstance = new PublicClientApplication(msalConfig);
  }
  return _msalInstance;
};

export const msScopes = ['offline_access', 'User.Read', 'Mail.Read', 'Mail.ReadWrite', 'Calendars.Read', 'Files.Read.All', 'Contacts.Read'];

export const buildMsLoginRequest = (state?: Record<string, unknown>): RedirectRequest => ({
  scopes: msScopes,
  prompt: 'consent',
  state: state ? btoa(JSON.stringify(state)) : undefined,
  // Use dynamic redirect URI
  redirectUri: `${window.location.origin}/integrations/microsoft365/callback`,
});

// Initialize MSAL only when needed for Microsoft integrations
export const initializeMsal = async (): Promise<PublicClientApplication> => {
  const instance = getMsalInstance();
  try {
    await instance.initialize();
  } catch (error) {
    throw error;
  }
  return instance;
};

// Legacy exports for backward compatibility - but these should only be used in Microsoft integration components
export const msalInstance = getMsalInstance();
export const msalReady = initializeMsal();


