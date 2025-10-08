/**
 * Zustand Slice Factory Pattern
 * 
 * This factory provides a standardized way to create Zustand store slices
 * with consistent patterns for state management, actions, and selectors.
 */

import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import type { StateCreator, StoreApi, UseBoundStore } from 'zustand';

export interface SliceConfig<T> {
  name: string;
  initialState: T;
  reducers: Record<string, (state: T, ...args: any[]) => Partial<T> | void>;
  selectors?: Record<string, (state: T) => any>;
  middleware?: StateCreator<T>[];
}

export interface SliceStore<T> {
  // State
  state: T;
  
  // Actions
  actions: {
    [K in keyof SliceConfig<T>['reducers']]: (...args: Parameters<SliceConfig<T>['reducers'][K]>) => void;
  };
  
  // Selectors
  selectors: {
    [K in keyof SliceConfig<T>['selectors']]: () => ReturnType<SliceConfig<T>['selectors'][K]>;
  };
  
  // Utilities
  getState: () => T;
  setState: (partial: Partial<T> | ((state: T) => Partial<T>)) => void;
  reset: () => void;
}

/**
 * Create a Zustand slice with standardized patterns
 */
export function createSlice<T extends Record<string, any>>(
  config: SliceConfig<T>
): UseBoundStore<StoreApi<SliceStore<T>>> {
  const { name, initialState, reducers, selectors = {}, middleware = [] } = config;

  // Create the store
  const store = create<SliceStore<T>>()(
    devtools(
      subscribeWithSelector((set, get) => ({
        // Initial state
        state: initialState,
        
        // Actions
        actions: Object.keys(reducers).reduce((acc, key) => {
          acc[key] = (...args: any[]) => {
            const result = reducers[key](get().state, ...args);
            if (result) {
              set((state) => ({ state: { ...state.state, ...result } }));
            }
          };
          return acc;
        }, {} as any),
        
        // Selectors
        selectors: Object.keys(selectors).reduce((acc, key) => {
          acc[key] = () => selectors[key](get().state);
          return acc;
        }, {} as any),
        
        // Utilities
        getState: () => get().state,
        setState: (partial) => {
          set((state) => ({
            state: typeof partial === 'function' ? partial(state.state) : { ...state.state, ...partial }
          }));
        },
        reset: () => {
          set({ state: initialState });
        }
      })),
      {
        name: `slice-${name}`,
        enabled: process.env.NODE_ENV === 'development'
      }
    )
  );

  return store;
}

/**
 * Create a simple slice with just state and actions
 */
export function createSimpleSlice<T extends Record<string, any>>(
  name: string,
  initialState: T,
  reducers: Record<string, (state: T, ...args: any[]) => Partial<T> | void>
) {
  return createSlice({
    name,
    initialState,
    reducers,
    selectors: {}
  });
}

/**
 * Hook to use a slice with automatic state updates
 */
export function useSlice<T extends Record<string, any>>(
  store: UseBoundStore<StoreApi<SliceStore<T>>>
) {
  const slice = store();
  
  return {
    // State
    ...slice.state,
    
    // Actions
    ...slice.actions,
    
    // Selectors
    ...slice.selectors,
    
    // Utilities
    getState: slice.getState,
    setState: slice.setState,
    reset: slice.reset
  };
}

/**
 * Hook to use only state from a slice
 */
export function useSliceState<T extends Record<string, any>>(
  store: UseBoundStore<StoreApi<SliceStore<T>>>
) {
  return store().state;
}

/**
 * Hook to use only actions from a slice
 */
export function useSliceActions<T extends Record<string, any>>(
  store: UseBoundStore<StoreApi<SliceStore<T>>>
) {
  return store().actions;
}

/**
 * Hook to use only selectors from a slice
 */
export function useSliceSelectors<T extends Record<string, any>>(
  store: UseBoundStore<StoreApi<SliceStore<T>>>
) {
  return store().selectors;
} 
