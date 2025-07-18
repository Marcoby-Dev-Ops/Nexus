import React from 'react';
import { cn } from '@/shared/utils/styles';

export interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  children: React.ReactNode;
}

export interface FormFieldProps {
  label?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

/**
 * Simple form components for 1.0
 */
const Form: React.FC<FormProps> = ({ children, className, ...props }) => {
  return (
    <form className={cn('space-y-4', className)} {...props}>
      {children}
    </form>
  );
};

export const FormField: React.FC<FormFieldProps> = ({ 
  label, 
  error, 
  required, 
  children, 
  className 
}) => {
  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}
      {children}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
};

export default Form; 