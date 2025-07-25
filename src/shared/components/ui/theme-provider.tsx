import React, { createContext, useContext, useEffect, useState } from 'react';
import { safeGetLocalStorage, safeSetLocalStorage } from '@/shared/utils/storageUtils.ts';

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
  primaryColor: 'green',
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
  defaultColor = 'green',
  ...props 
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const storedTheme = safeGetLocalStorage<Theme>('theme', defaultTheme);
      console.log('[ThemeProvider] Initial theme loaded:', storedTheme, 'defaultTheme:', defaultTheme);
      return storedTheme;
    } catch (error) {
      console.error('[ThemeProvider] Error loading theme from localStorage:', error);
      return defaultTheme;
    }
  });
  
  const [primaryColor, setPrimaryColor] = useState<string>(() => {
    try {
      const storedColor = safeGetLocalStorage<string>('primaryColor', defaultColor);
      console.log('[ThemeProvider] Initial primary color loaded:', storedColor);
      return storedColor;
    } catch (error) {
      console.error('[ThemeProvider] Error loading primary color from localStorage:', error);
      return defaultColor;
    }
  });

  useEffect(() => {
    try {
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');

      if (theme === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        root.classList.add(systemTheme);
        console.log('[ThemeProvider] Applied system theme:', systemTheme);
      } else {
        root.classList.add(theme);
        console.log('[ThemeProvider] Applied theme:', theme);
      }
    } catch (error) {
      console.error('[ThemeProvider] Error applying theme:', error);
    }
  }, [theme]);

  useEffect(() => {
    try {
      const root = window.document.documentElement;
      const color = COLORS.find(c => c.name === primaryColor);
      if (color) {
        root.style.setProperty('--primary', color.value);
        root.style.setProperty('--primary-foreground', color.foreground);
        console.log('[ThemeProvider] Applied primary color:', primaryColor);
      }
    } catch (error) {
      console.error('[ThemeProvider] Error applying primary color:', error);
    }
  }, [primaryColor]);

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      try {
        safeSetLocalStorage('theme', theme);
        setTheme(theme);
        console.log('[ThemeProvider] Theme updated:', theme);
      } catch (error) {
        console.error('[ThemeProvider] Error saving theme to localStorage:', error);
        setTheme(theme); // Still update the state even if localStorage fails
      }
    },
    primaryColor,
    setPrimaryColor: (color: string) => {
      try {
        safeSetLocalStorage('primaryColor', color);
        setPrimaryColor(color);
        console.log('[ThemeProvider] Primary color updated:', color);
      } catch (error) {
        console.error('[ThemeProvider] Error saving primary color to localStorage:', error);
        setPrimaryColor(color); // Still update the state even if localStorage fails
      }
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