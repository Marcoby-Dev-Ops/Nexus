// Small test setup for Vitest to provide jest compatibility and simple browser globals
import { vi } from 'vitest'

// Provide a `jest` alias so older tests using jest.fn() and timers work
;(global as any).jest = {
  fn: vi.fn,
  spyOn: vi.spyOn,
  clearAllMocks: () => vi.clearAllMocks(),
  restoreAllMocks: () => vi.restoreAllMocks(),
  // Timer helpers mapped to vitest's vi timers
  useFakeTimers: () => vi.useFakeTimers(),
  useRealTimers: () => vi.useRealTimers(),
  advanceTimersByTime: (ms: number) => vi.advanceTimersByTime(ms),
}

// Basic localStorage mock if not already provided by environment (node/jsdom may not provide it)
if (typeof (global as any).localStorage === 'undefined') {
  const store: Record<string, string> = {}
  ;(global as any).localStorage = {
    getItem: (key: string) => (store[key] ?? null),
    setItem: (key: string, value: string) => { store[key] = String(value) },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { Object.keys(store).forEach(k => delete store[k]) },
  }
}

// Also expose to window in case tests reference window.localStorage directly
if (typeof (global as any).window !== 'undefined' && typeof (global as any).window.localStorage === 'undefined') {
  ;(global as any).window.localStorage = (global as any).localStorage
}
