import React, { createContext, useContext, useEffect, useState } from 'react';
import { safeGetLocalStorage, safeSetLocalStorage } from '../../lib/storageUtils';

type Theme = 'dark' | 'light' | 'system';

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
  theme: 'system',
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

/**
 * @name ThemeProvider
 * @description Provides theme context to the application for light/dark/system mode.
 * @param {ThemeProviderProps} props - The props for the component.
 * @returns {JSX.Element}
 */
export function ThemeProvider({ 
  children, 
  defaultTheme = 'system', 
  ...props 
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => safeGetLocalStorage<Theme>('theme', defaultTheme)
  );

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
  }, [theme]);

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      safeSetLocalStorage('theme', theme);
      setTheme(theme);
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

/**
 * @name useTheme
 * @description Hook to access the current theme and a function to update it.
 * @returns {ThemeProviderState} The current theme state and setter.
 */
export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 