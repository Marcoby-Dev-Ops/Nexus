import React from 'react';
import { cn } from '@/lib/styles';

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
  variant?: 'default' | 'required';
}

/**
 * Label component for form inputs
 * @param className - Additional CSS classes
 * @param variant - Label variant (default, required)
 * @param children - Label content
 * @param props - Additional label props
 */
export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          'block text-sm font-medium text-foreground mb-1',
          variant === 'required' && 'after:content-["*"] after:text-destructive after:ml-1',
          className
        )}
        {...props}
      >
        {children}
      </label>
    );
  }
);

Label.displayName = 'Label';

export default Label; 