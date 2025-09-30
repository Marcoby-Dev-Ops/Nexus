import { create } from 'zustand';
import type { AuthSession, AuthUser } from './authentikAuthServiceInstance';

export const AUTH_SESSION_STORAGE_KEY = 'authentik_session';

interface AuthStoreState {
  user: AuthUser | null;
  session: AuthSession | null;
  loading: boolean;
  initialized: boolean;
  error: Error | null;
  isAuthenticated: boolean;
  setAuthState: (session: AuthSession | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: Error | null) => void;
  setInitialized: (initialized: boolean) => void;
  clearAuthState: (keepInitialized?: boolean) => void;
}

const initialState: Omit<AuthStoreState, 'setAuthState' | 'setLoading' | 'setError' | 'setInitialized' | 'clearAuthState'> = {
  user: null,
  session: null,
  loading: false,
  initialized: false,
  error: null,
  isAuthenticated: false,
};

export const useAuthStore = create<AuthStoreState>((set) => ({
  ...initialState,
  setAuthState: (session) =>
    set(() => ({
      session,
      user: session?.user ?? null,
      isAuthenticated: Boolean(session?.user),
      error: null,
    })),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setInitialized: (initialized) => set({ initialized }),
  clearAuthState: (keepInitialized = false) =>
    set(() => ({
      ...initialState,
      initialized: keepInitialized,
    })),
}));

export function persistSessionToStorage(session: AuthSession | null): void {
  if (typeof window === 'undefined') return;

  if (session) {
    try {
      localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(session));
    } catch (error) {
      console.warn('Failed to persist auth session', error);
    }
  } else {
    localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
  }
}

export function loadSessionFromStorage(): AuthSession | null {
  if (typeof window === 'undefined') return null;

  const rawSession = localStorage.getItem(AUTH_SESSION_STORAGE_KEY);
  if (!rawSession) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawSession);

    if (
      parsed &&
      typeof parsed === 'object' &&
      'session' in parsed &&
      parsed.session &&
      typeof parsed.session.accessToken === 'string' &&
      'user' in parsed &&
      parsed.user &&
      typeof parsed.user === 'object'
    ) {
      return parsed as AuthSession;
    }

    console.warn('Ignoring malformed stored auth session');
    localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to parse stored auth session', error);
    localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
  }

  return null;
}

export function clearStoredSession(): void {
  persistSessionToStorage(null);
}
