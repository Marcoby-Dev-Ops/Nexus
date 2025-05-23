import React from 'react';
import clsx from 'clsx';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary';
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
}) => (
  <span
    className={clsx(
      'inline-flex items-center font-medium rounded select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition',
      variant === 'secondary'
        ? 'bg-secondary text-secondary-foreground'
        : 'bg-primary text-primary-foreground',
      size === 'xs' ? 'text-xs px-2 py-0.5 h-5' : 'text-sm px-3 py-1 h-6',
      className
    )}
    tabIndex={0}
    {...props}
  >
    {children}
  </span>
);

export default Badge; 