import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type FireCyclePhase = 'focus' | 'insight' | 'roadmap' | 'execute';

interface FireCycleStore {
  phase: FireCyclePhase;
  setPhase: (phase: FireCyclePhase) => void;
  reset: () => void;
}

export const useFireCycleStore = create<FireCycleStore>()(
  persist(
    (set) => ({
      phase: 'focus',
      setPhase: (phase) => set({ phase }),
      reset: () => set({ phase: 'focus' }),
    }),
    {
      name: 'fire-cycle-phase',
    }
  )
); 
