import React from 'react';
import PropTypes from 'prop-types';

/**
 * @interface ButtonProps
 * @description Props for the Button component.
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'destructive';
  loading?: boolean;
}

/**
 * @name Button
 * @description A reusable button component with variants and loading state.
 * @param {ButtonProps} props - The props for the component.
 * @returns {JSX.Element} The rendered Button component.
 */
export const Button: React.FC<ButtonProps> = React.memo(({ 
  variant = 'primary', 
  loading = false, 
  disabled, 
  children, 
  className = '', 
  ...props 
}) => {
  const base = 'inline-flex items-center justify-center rounded-md px-4 py-2 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
  const variants = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/80',
  };
  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin mr-2 h-4 w-4 text-current" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      )}
      {children}
    </button>
  );
});

Button.displayName = 'Button';

Button.propTypes = {
  variant: PropTypes.oneOf(['primary', 'secondary', 'destructive']),
  loading: PropTypes.bool,
  disabled: PropTypes.bool,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

export default Button; 