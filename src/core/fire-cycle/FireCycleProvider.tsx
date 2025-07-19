import React, { createContext, useContext } from 'react';
import { useFireCycleStore } from './fireCycleStore';
import type { FireCyclePhase } from './fireCycleStore';

interface FireCycleContextValue {
  phase: FireCyclePhase;
  setPhase: (phase: FireCyclePhase) => void;
  reset: () => void;
}

const FireCycleContext = createContext<FireCycleContextValue | undefined>(undefined);

export const FireCycleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const phase = useFireCycleStore((s) => s.phase);
  const setPhase = useFireCycleStore((s) => s.setPhase);
  const reset = useFireCycleStore((s) => s.reset);

  return (
    <FireCycleContext.Provider value={{ phase, setPhase, reset }}>
      {children}
    </FireCycleContext.Provider>
  );
};

export function useFireCyclePhase() {
  const ctx = useContext(FireCycleContext);
  if (!ctx) throw new Error('useFireCyclePhase must be used within FireCycleProvider');
  return ctx;
} 