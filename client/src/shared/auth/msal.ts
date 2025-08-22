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
  },
};

export const msalInstance = new PublicClientApplication(msalConfig);

export const msScopes = ['offline_access', 'User.Read', 'Mail.Read', 'Mail.ReadWrite', 'Calendars.Read', 'Files.Read.All', 'Contacts.Read'];

export const buildMsLoginRequest = (state?: Record<string, unknown>): RedirectRequest => ({
  scopes: msScopes,
  prompt: 'consent',
  state: state ? btoa(JSON.stringify(state)) : undefined,
  // Use dynamic redirect URI
  redirectUri: `${window.location.origin}/integrations/microsoft365/callback`,
});

// App-wide MSAL readiness: initialize and handle any pending redirects once
export const msalReady: Promise<void> = (async () => {
  try {
    await msalInstance.initialize();
    // Do NOT call handleRedirectPromise() here; the callback page handles it explicitly
  } catch {
    // Swallow to avoid unhandled errors at module load
  }
})();


