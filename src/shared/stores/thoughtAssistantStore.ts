import { create } from 'zustand';

interface ThoughtAssistantStoreState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

export const useThoughtAssistantStore = create<ThoughtAssistantStoreState>((set, get) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
})); 