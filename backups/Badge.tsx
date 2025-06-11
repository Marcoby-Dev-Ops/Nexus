import React from 'react';
import clsx from 'clsx';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  size?: 'default' | 'xs';
  className?: string;
}

/**
 * @name Badge
 * @description A small badge for status or counts, with variant and size support.
 * @param {BadgeProps} props
 * @returns {JSX.Element}
 */
export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  size = 'default',
  className = '',
  children,
  ...props
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'secondary':
        return 'bg-secondary text-secondary-foreground';
      case 'destructive':
        return 'bg-destructive text-destructive-foreground';
      case 'outline':
        return 'border border-input bg-background text-foreground';
      default:
        return 'bg-primary text-primary-foreground';
    }
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center font-medium rounded select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition',
        getVariantClasses(),
        size === 'xs' ? 'text-xs px-4 py-0.5 h-5' : 'text-sm px-4 py-4 h-6',
        className
      )}
      tabIndex={0}
      {...props}
    >
      {children}
    </span>
  );
};

export default Badge; 