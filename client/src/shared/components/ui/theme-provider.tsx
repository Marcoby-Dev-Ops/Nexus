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
  // Prevent duplicate "initial" logs under React StrictMode double render in dev
  // Module-level flags ensure we only log the initial load once per window
  type WindowWithNexusFlags = Window & {
    __nexus_hasLoggedInitialTheme?: boolean;
    __nexus_hasLoggedInitialPrimary?: boolean;
    __nexus_themeApplied?: boolean;
    __nexus_primaryApplied?: boolean;
  };
  const w = window as WindowWithNexusFlags;

  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const storedTheme = safeGetLocalStorage<Theme>('theme', defaultTheme);
      if (!w.__nexus_hasLoggedInitialTheme) {
        logger.info('[ThemeProvider] Initial theme loaded:', storedTheme, 'defaultTheme:', defaultTheme);
        w.__nexus_hasLoggedInitialTheme = true;
      }
      return storedTheme;
    } catch (error) {
      logger.error('[ThemeProvider] Error loading theme from localStorage:', error);
      return defaultTheme;
    }
  });
  
  const [primaryColor, setPrimaryColor] = useState<PrimaryColor>(() => {
    try {
      const storedColor = safeGetLocalStorage<PrimaryColor>('primaryColor', defaultColor);
      if (!w.__nexus_hasLoggedInitialPrimary) {
        logger.info('[ThemeProvider] Initial primary color loaded:', storedColor);
        w.__nexus_hasLoggedInitialPrimary = true;
      }
      return storedColor;
    } catch (error) {
      logger.error('[ThemeProvider] Error loading primary color from localStorage:', error);
      return defaultColor;
    }
  });

  // Apply theme with better React StrictMode handling
  useEffect(() => {
    try {
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');

      if (theme === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        root.classList.add(systemTheme);
        // Only log if not already applied to prevent duplicate logs in StrictMode
        if (!w.__nexus_themeApplied) {
          logger.info('[ThemeProvider] Applied system theme:', systemTheme);
          w.__nexus_themeApplied = true;
        }
      } else {
        root.classList.add(theme);
        // Only log if not already applied to prevent duplicate logs in StrictMode
        if (!w.__nexus_themeApplied) {
          logger.info('[ThemeProvider] Applied theme:', theme);
          w.__nexus_themeApplied = true;
        }
      }
    } catch (error) {
      logger.error('[ThemeProvider] Error applying theme:', error);
    }
  }, [theme]);

  // Apply primary color with better React StrictMode handling
  useEffect(() => {
    try {
      const root = window.document.documentElement;
      const color = THEME_COLORS.find(c => c.name === primaryColor);
      if (color) {
        root.style.setProperty('--primary', color.value);
        root.style.setProperty('--primary-foreground', color.foreground);
        // Only log if not already applied to prevent duplicate logs in StrictMode
        if (!w.__nexus_primaryApplied) {
          logger.info('[ThemeProvider] Applied primary color:', primaryColor);
          w.__nexus_primaryApplied = true;
        }
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
