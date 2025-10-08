// Central non-component exports for theme system
import { THEME_COLORS } from '@/shared/constants/theme';
export const COLORS = THEME_COLORS;
// Export the hook from the public ThemeProvider so consumers use the same context
// used by the <ThemeProvider> component (avoid duplicate contexts).
export { useTheme } from './theme-provider';
