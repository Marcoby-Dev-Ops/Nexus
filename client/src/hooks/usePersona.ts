import { useCallback, useEffect, useState } from 'react';

export type Persona = 'owner' | 'employee';

const STORAGE_KEY = 'nexus_persona';

function readInitialPersona(): Persona | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const p = params.get('p');
    if (p === 'owner' || p === 'employee') return p;
    const stored = localStorage.getItem(STORAGE_KEY); 
    if (stored === 'owner' || stored === 'employee') return stored;
  } catch {
    /* noop */
  }
  return null;
}

export function usePersona() {
  const [persona, setPersonaState] = useState<Persona | null>(() => readInitialPersona());

  const setPersona = useCallback((p: Persona) => {
    setPersonaState(p);
    try { localStorage.setItem(STORAGE_KEY, p); } catch { /* ignore */ }
    window.dispatchEvent(new CustomEvent('PersonaSelected', { detail: { persona: p } }));
    // Append/replace URL param without full reload
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('p', p);
      window.history.replaceState({}, '', url.toString());
    } catch { /* ignore */ }
  }, []);

  // Ensure we rehydrate if query param manually changed client-side
  useEffect(() => {
    const handler = () => {
      const current = readInitialPersona();
      if (current && current !== persona) setPersonaState(current);
    };
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, [persona]);

  return {
    persona,
    isOwner: persona === 'owner',
    isEmployee: persona === 'employee',
    setPersona
  };
}
