/**
 * Chart Colors Utility
 * 
 * Provides brand-aligned color values for data visualization components
 * Uses CSS variables to maintain theme consistency
 */

// Helper to convert CSS hsl variable to string suitable for charts
const getCssVariableValue = (variableName: string): string => {
  // For browser environment
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const computedStyle = getComputedStyle(document.documentElement);
    return `hsl(${computedStyle.getPropertyValue(variableName)})`;
  }
  
  // Fallback for SSR - these match our brand colors closely
  const fallbackColors: Record<string, string> = {
    '--primary': '#006837',
    '--secondary': '#00a651',
    '--accent': '#007aff',
    '--destructive': '#e11d48',
    '--warning': '#f59e0b',
    '--success': '#10b981',
    '--muted': '#64748b',
  };
  
  const key = variableName.startsWith('--') ? variableName: `--${variableName}`;
  return fallbackColors[key] || '#006837'; // Default to primary if not found
};

// Main chart colors - use these for data visualization
export const chartColors = {
  // Using hsl() wrapper ensures CSS variables resolve correctly in SVG attributes
  primary: 'hsl(var(--primary))',
  secondary: 'hsl(var(--secondary))',
  accent: 'hsl(var(--accent))',
  success: 'hsl(var(--success))',
  warning: 'hsl(var(--warning))',
  destructive: 'hsl(var(--destructive))',
  muted: 'hsl(var(--muted))',
  
  // Opacity variants (20% opacity)
  primaryLight: 'hsl(var(--primary) / 0.2)',
  secondaryLight: 'hsl(var(--secondary) / 0.2)',
  accentLight: 'hsl(var(--accent) / 0.2)',
  
  // Categorical palette for multi-series charts
  categorical: [
    'hsl(var(--primary))',
    'hsl(var(--secondary))',
    'hsl(var(--accent))',
    'hsl(var(--success))',
    'hsl(var(--warning))',
    'hsl(var(--destructive))',
  ],
};

// Generate a color sequence for multiple data series
export const getColorSequence = (count: number): string[] => {
  const baseColors = chartColors.categorical;
  
  if (count <= baseColors.length) {
    return baseColors.slice(0, count);
  }
  
  // For more colors than in our base palette, we create variations
  const result: string[] = [...baseColors];
  
  while (result.length < count) {
    // Add opacity variations of the base colors
    const index = result.length % baseColors.length;
    const opacity = 0.8 - (Math.floor(result.length / baseColors.length) * 0.2);
    result.push(`${baseColors[index]}/${Math.max(opacity * 100, 30)}%`);
  }
  
  return result;
};

export default chartColors; 
