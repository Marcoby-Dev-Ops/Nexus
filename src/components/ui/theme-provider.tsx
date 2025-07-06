import React, { createContext, useContext, useEffect, useState } from 'react';
import { safeGetLocalStorage, safeSetLocalStorage } from '../../lib/utils/storageUtils';

type Theme = 'dark' | 'light' | 'system';

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  defaultColor?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  primaryColor: string;
  setPrimaryColor: (color: string) => void;
};

const initialState: ThemeProviderState = {
  theme: 'system',
  setTheme: () => null,
  primaryColor: 'blue',
  setPrimaryColor: () => null,
};

export const COLORS = [
  { name: 'blue', value: '221.2 83.2% 53.3%', foreground: '210 40% 98%' },
  { name: 'green', value: '142.1 76.2% 36.3%', foreground: '210 40% 98%' },
  { name: 'orange', value: '24.6 95% 53.1%', foreground: '210 40% 98%' },
  { name: 'red', value: '0 84.2% 60.2%', foreground: '210 40% 98%' },
  { name: 'purple', value: '262.1 83.3% 57.8%', foreground: '210 40% 98%' },
];

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
  defaultColor = 'blue',
  ...props 
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => safeGetLocalStorage<Theme>('theme', defaultTheme)
  );
  const [primaryColor, setPrimaryColor] = useState<string>(
    () => safeGetLocalStorage<string>('primaryColor', defaultColor)
  );

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  useEffect(() => {
    const root = window.document.documentElement;
    const color = COLORS.find(c => c.name === primaryColor);
    if (color) {
      root.style.setProperty('--primary', color.value);
      root.style.setProperty('--primary-foreground', color.foreground);
    }
  }, [primaryColor]);

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      safeSetLocalStorage('theme', theme);
      setTheme(theme);
    },
    primaryColor,
    setPrimaryColor: (color: string) => {
      safeSetLocalStorage('primaryColor', color);
      setPrimaryColor(color);
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