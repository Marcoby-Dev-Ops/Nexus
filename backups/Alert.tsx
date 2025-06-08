import React from 'react';
import { cn } from '@/lib/utils';
import PropTypes from 'prop-types';

/**
 * @interface AlertProps
 * @description Props for the Alert component.
 */
export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'error' | 'success' | 'warning';
  action?: React.ReactNode;
}

/**
 * @name Alert
 * @description A notification component for feedback messages.
 * @param {AlertProps} props - The props for the component.
 * @returns {JSX.Element} The rendered Alert component.
 */
export const Alert: React.FC<AlertProps> = ({
  children,
  className,
  variant = 'default',
  action,
  ...props
}) => {
  const variants = {
    default: 'bg-muted text-foreground',
    error: 'bg-destructive/10 text-destructive',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning'
  };

  return (
    <div
      className={cn(
        'rounded-lg p-4 flex items-start gap-4',
        variants[variant],
        className
      )}
      {...props}
    >
      <div className="flex-1">{children}</div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
};

Alert.displayName = 'Alert';

Alert.propTypes = {
  variant: PropTypes.oneOf(['default', 'error', 'success', 'warning']),
  action: PropTypes.node,
  className: PropTypes.string,
};

export default Alert; 