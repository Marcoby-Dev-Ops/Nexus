/**
 * Theme Slice using the Zustand Slice Factory Pattern
 * 
 * This demonstrates how to use the slice factory to create a clean,
 * type-safe store with consistent patterns.
 */

import { createSlice, useSlice } from './sliceFactory';

export type Theme = 'light' | 'dark' | 'system';

export interface ThemeState {
  theme: Theme;
  isLoaded: boolean;
  lastUpdated: Date | null;
}

const initialState: ThemeState = {
  theme: 'system',
  isLoaded: false,
  lastUpdated: null
};

const themeReducers = {
  setTheme: (state: ThemeState, theme: Theme) => ({
    theme,
    lastUpdated: new Date()
  }),
  
  setLoaded: (state: ThemeState, isLoaded: boolean) => ({
    isLoaded
  }),
  
  reset: (state: ThemeState) => ({
    ...initialState,
    lastUpdated: new Date()
  }),
  
  updateFromSystem: (state: ThemeState) => {
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    return {
      theme: systemTheme,
      lastUpdated: new Date()
    };
  }
};

const themeSelectors = {
  isDark: (state: ThemeState) => {
    if (state.theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return state.theme === 'dark';
  },
  
  isLight: (state: ThemeState) => {
    if (state.theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: light)').matches;
    }
    return state.theme === 'light';
  },
  
  isSystem: (state: ThemeState) => state.theme === 'system',
  
  themeDisplayName: (state: ThemeState) => {
    switch (state.theme) {
      case 'light': return 'Light';
      case 'dark': return 'Dark';
      case 'system': return 'System';
      default: return 'Unknown';
    }
  }
};

// Create the theme slice
export const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: themeReducers,
  selectors: themeSelectors
});

// Export the hook for easy use
export const useTheme = () => useSlice(themeSlice);

// Export individual hooks for granular access
export const useThemeState = () => themeSlice().state;
export const useThemeActions = () => themeSlice().actions;
export const useThemeSelectors = () => themeSlice().selectors;

// Export the store for direct access if needed
export const themeStore = themeSlice; 
