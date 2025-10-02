import React, { createContext, useContext, useEffect, useState } from 'react';
import { safeGetLocalStorage, safeSetLocalStorage } from '@/shared/utils/storageUtils';
import { THEME_COLORS, type Theme, type PrimaryColor } from '@/shared/constants/theme';
import { logger } from '@/shared/utils/logger';

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  defaultColor?: PrimaryColor;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  primaryColor: PrimaryColor;
  setPrimaryColor: (color: PrimaryColor) => void;
};

const initialState: ThemeProviderState = {
  theme: 'system',
  setTheme: () => null,
  primaryColor: 'green',
  setPrimaryColor: () => null,
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
  defaultColor = 'green',
  ...props 
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const storedTheme = safeGetLocalStorage<Theme>('theme', defaultTheme);
      logger.info('[ThemeProvider] Initial theme loaded:', storedTheme);
      return storedTheme;
    } catch (error) {
      logger.error('[ThemeProvider] Error loading theme from localStorage:', error);
      return defaultTheme;
    }
  });
  
  const [primaryColor, setPrimaryColor] = useState<PrimaryColor>(() => {
    try {
      const storedColor = safeGetLocalStorage<PrimaryColor>('primaryColor', defaultColor);
      logger.info('[ThemeProvider] Initial primary color loaded:', storedColor);
      return storedColor;
    } catch (error) {
      logger.error('[ThemeProvider] Error loading primary color from localStorage:', error);
      return defaultColor;
    }
  });

  // Apply theme
  useEffect(() => {
    try {
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');

      if (theme === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        root.classList.add(systemTheme);
        logger.info('[ThemeProvider] Applied system theme:', systemTheme);
      } else {
        root.classList.add(theme);
        logger.info('[ThemeProvider] Applied theme:', theme);
      }
    } catch (error) {
      logger.error('[ThemeProvider] Error applying theme:', error);
    }
  }, [theme]);

  // Apply primary color
  useEffect(() => {
    try {
      const root = window.document.documentElement;
      const color = THEME_COLORS.find(c => c.name === primaryColor);
      if (color) {
        root.style.setProperty('--primary', color.value);
        root.style.setProperty('--primary-foreground', color.foreground);
        logger.info('[ThemeProvider] Applied primary color:', primaryColor);
      }
    } catch (error) {
      logger.error('[ThemeProvider] Error applying primary color:', error);
    }
  }, [primaryColor]);

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      try {
        safeSetLocalStorage('theme', theme);
        setTheme(theme);
        logger.info('[ThemeProvider] Theme updated:', theme);
      } catch (error) {
        logger.error('[ThemeProvider] Error saving theme to localStorage:', error);
        setTheme(theme); // Still update the state even if localStorage fails
      }
    },
    primaryColor,
    setPrimaryColor: (color: PrimaryColor) => {
      try {
        safeSetLocalStorage('primaryColor', color);
        setPrimaryColor(color);
        logger.info('[ThemeProvider] Primary color updated:', color);
      } catch (error) {
        logger.error('[ThemeProvider] Error saving primary color to localStorage:', error);
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
