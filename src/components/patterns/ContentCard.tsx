import React from 'react';

/**
 * Standardized Content Card
 * 
 * Provides consistent card styling across the application.
 * Replaces manual div cards with inconsistent styling.
 */

export interface ContentCardProps {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'outlined';
}

export const ContentCard: React.FC<ContentCardProps> = ({ 
  title, 
  action, 
  children, 
  className = '',
  variant = 'default'
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'elevated':
        return 'bg-card dark:bg-background rounded-2xl p-8 shadow-lg border border-border/50 dark:border-border/50 hover:shadow-xl transition-all duration-300';
      case 'outlined':
        return 'bg-transparent border-2 border-border rounded-xl p-6 hover:bg-muted/5 transition-colors duration-200';
      default:
        return 'bg-card text-card-foreground rounded-xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow duration-200';
    }
  };

  return (
    <div className={`${getVariantClasses()} ${className}`}>
      {title && (
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-foreground">{title}</h3>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};

/**
 * Pre-configured card variants for common use cases
 */

/**
 * Dashboard-style elevated card
 */
export const DashboardCard = ({
  title,
  action,
  children,
  className,
}: ContentCardProps) => (
  <ContentCard
    title={title}
    action={action}
    variant="elevated"
    className={className}
  >
    {children}
  </ContentCard>
);

/**
 * Simple outlined card for secondary content
 */
export const OutlinedCard = ({
  title,
  action,
  children,
  className,
}: ContentCardProps) => (
  <ContentCard
    title={title}
    action={action}
    variant="outlined"
    className={className}
  >
    {children}
  </ContentCard>
);

/**
 * Stats/KPI card with consistent styling
 */
export const StatsCard = ({
  title,
  children,
  className,
}: Omit<ContentCardProps, 'action'>) => (
  <ContentCard title={title} variant="default" className={`text-center ${className}`}>
    {children}
  </ContentCard>
); 