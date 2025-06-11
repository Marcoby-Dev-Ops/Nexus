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
  
  const key = variableName.startsWith('--') ? variableName : `--${variableName}`;
  return fallbackColors[key] || '#006837'; // Default to primary if not found
};

// Main chart colors - use these for data visualization
export const chartColors = {
  primary: 'var(--primary)',
  secondary: 'var(--secondary)',
  accent: 'var(--accent)',
  success: 'var(--success)',
  warning: 'var(--warning)',
  destructive: 'var(--destructive)',
  muted: 'var(--muted)',
  
  // Opacity variants
  primaryLight: 'var(--primary/20)',
  secondaryLight: 'var(--secondary/20)',
  accentLight: 'var(--accent/20)',
  
  // Categorical data colors (for pie/bar charts with multiple categories)
  categorical: [
    'var(--primary)',
    'var(--secondary)',
    'var(--accent)',
    'var(--success)',
    'var(--warning)',
    'var(--destructive)',
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