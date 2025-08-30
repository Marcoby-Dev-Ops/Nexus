import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function to merge Tailwind CSS classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Reusable button style variants
 */
export const buttonVariants = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring shadow-sm',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 focus-visible:ring-ring',
  destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-ring',
  ghost: 'hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring',
  link: 'text-primary underline-offset-4 hover:underline focus-visible:ring-ring',
  outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring',
};

/**
 * Reusable button size variants
 */
export const buttonSizes = {
  sm: 'h-8 px-4 text-sm',
  md: 'h-10 px-4',
  lg: 'h-12 px-6 text-lg',
  icon: 'h-8 w-8 p-0',
  iconSm: 'h-6 w-6 p-0',
  iconLg: 'h-12 w-12 p-0',
};

/**
 * Base button styles
 */
export const buttonBase = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible: outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';

/**
 * Interactive element styles (for clickable cards, tiles, etc.)
 */
export const interactiveStyles = {
  card: 'hover:bg-accent/50 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-ring cursor-pointer transition-all duration-200',
  tile: 'hover:bg-accent/50 hover:shadow-lg hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-ring cursor-pointer transition-all duration-200',
  button: 'hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring cursor-pointer transition-colors',
};

/**
 * Card style variants
 */
export const cardVariants = {
  default: 'bg-card text-card-foreground rounded-xl shadow border',
  elevated: 'bg-card text-card-foreground rounded-xl shadow-lg border hover:shadow-xl transition-shadow',
  flat: 'bg-card text-card-foreground rounded-xl border',
  glass: 'bg-card/80 backdrop-blur-sm text-card-foreground rounded-xl border shadow-lg',
};

/**
 * Text style variants
 */
export const textVariants = {
  h1: 'text-3xl font-bold text-foreground',
  h2: 'text-2xl font-semibold text-foreground',
  h3: 'text-xl font-semibold text-foreground',
  h4: 'text-lg font-medium text-foreground',
  body: 'text-sm text-foreground',
  muted: 'text-sm text-muted-foreground',
  small: 'text-xs text-muted-foreground',
};

/**
 * Input style variants
 */
export const inputVariants = {
  default: 'flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
  error: 'flex w-full rounded-md border border-destructive bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
};

/**
 * Status/State colors
 */
export const statusColors = {
  success: 'text-success',
  error: 'text-destructive',
  warning: 'text-warning',
  info: 'text-primary',
  neutral: 'text-muted-foreground',
};

/**
 * Background variants for status/state
 */
export const statusBackgrounds = {
  success: 'bg-success/10 text-success border-success/20',
  error: 'bg-destructive/10 text-destructive border-destructive/20',
  warning: 'bg-warning/10 text-warning border-warning/20',
  info: 'bg-primary/10 text-primary border-primary/20',
  neutral: 'bg-muted text-muted-foreground border-border',
};

/**
 * Helper function to get button classes
 */
export function getButtonClasses(
  variant: keyof typeof buttonVariants = 'primary',
  size: keyof typeof buttonSizes = 'md',
  className?: string
) {
  return cn(buttonBase, buttonVariants[variant], buttonSizes[size], className);
}

/**
 * Helper function to get card classes
 */
export function getCardClasses(
  variant: keyof typeof cardVariants = 'default',
  interactive?: boolean,
  className?: string
) {
  return cn(
    cardVariants[variant],
    interactive && interactiveStyles.card,
    className
  );
}

/**
 * Helper function to get text classes
 */
export function getTextClasses(
  variant: keyof typeof textVariants = 'body',
  className?: string
) {
  return cn(textVariants[variant], className);
} 
