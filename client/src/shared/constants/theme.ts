/**
 * Theme constants and color definitions
 */

export const THEME_COLORS = [
  { name: 'blue', value: '221.2 83.2% 53.3%', foreground: '210 40% 98%' },
  { name: 'green', value: '142.1 76.2% 36.3%', foreground: '210 40% 98%' },
  { name: 'orange', value: '24.6 95% 53.1%', foreground: '210 40% 98%' },
  { name: 'red', value: '0 84.2% 60.2%', foreground: '210 40% 98%' },
  { name: 'purple', value: '262.1 83.3% 57.8%', foreground: '210 40% 98%' },
] as const;

export type Theme = 'dark' | 'light' | 'system';
export type PrimaryColor = typeof THEME_COLORS[number]['name']; 
