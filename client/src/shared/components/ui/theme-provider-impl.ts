// Internal implementation utilities for ThemeProvider separated to satisfy react-refresh rule.
import { safeGetLocalStorage, safeSetLocalStorage } from '@/shared/utils/storageUtils';
import { THEME_COLORS, type Theme, type PrimaryColor } from '@/shared/constants/theme';
import { logger } from '@/shared/utils/logger';
import { createContext, useContext } from 'react';

export interface ThemeStateHandlers {
  loadInitialTheme: (defaultTheme: Theme) => Theme;
  loadInitialPrimaryColor: (defaultColor: PrimaryColor) => PrimaryColor;
  applyTheme: (theme: Theme) => void;
  applyPrimaryColor: (color: PrimaryColor) => void;
  persistTheme: (theme: Theme) => void;
  persistPrimaryColor: (color: PrimaryColor) => void;
}

export function createThemeHandlers(): ThemeStateHandlers {
  return {
    loadInitialTheme(defaultTheme) {
      try {
        const storedTheme = safeGetLocalStorage<Theme>('theme', defaultTheme);
        logger.info('[ThemeProvider] Initial theme loaded:', storedTheme);
        return storedTheme;
      } catch (error) {
        logger.error('[ThemeProvider] Error loading theme from localStorage:', error);
        return defaultTheme;
      }
    },
    loadInitialPrimaryColor(defaultColor) {
      try {
        const storedColor = safeGetLocalStorage<PrimaryColor>('primaryColor', defaultColor);
        logger.info('[ThemeProvider] Initial primary color loaded:', storedColor);
        return storedColor;
      } catch (error) {
        logger.error('[ThemeProvider] Error loading primary color from localStorage:', error);
        return defaultColor;
      }
    },
    applyTheme(theme) {
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
    },
    applyPrimaryColor(primaryColor) {
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
    },
    persistTheme(theme) {
      try {
        safeSetLocalStorage('theme', theme);
        logger.info('[ThemeProvider] Theme updated:', theme);
      } catch (error) {
        logger.error('[ThemeProvider] Error saving theme to localStorage:', error);
      }
    },
    persistPrimaryColor(color) {
      try {
        safeSetLocalStorage('primaryColor', color);
        logger.info('[ThemeProvider] Primary color updated:', color);
      } catch (error) {
        logger.error('[ThemeProvider] Error saving primary color to localStorage:', error);
      }
    },
  };
}

// Context + hook moved here to avoid extra export in component file triggering react-refresh warning
export interface ThemeProviderState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  primaryColor: PrimaryColor;
  setPrimaryColor: (color: PrimaryColor) => void;
}

export const ThemeProviderContext = createContext<ThemeProviderState | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};
