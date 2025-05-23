import React from 'react';
import PropTypes from 'prop-types';

/**
 * @interface InputProps
 * @description Props for the Input component.
 */
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  icon?: React.ReactNode;
}

/**
 * @name Input
 * @description A styled input field with error and icon support.
 * @param {InputProps} props - The props for the component.
 * @returns {JSX.Element} The rendered Input component.
 */
export const Input: React.FC<InputProps> = React.memo(({ error, icon, className = '', ...props }) => (
  <div className="flex flex-col gap-1">
    <div className={`relative flex items-center ${error ? 'border-destructive' : 'border-input'} border rounded-md px-3 py-2 bg-background ${className}`}>
      {icon && <span className="mr-2 text-muted-foreground">{icon}</span>}
      <input
        className="flex-1 bg-transparent outline-none"
        aria-invalid={!!error}
        {...props}
      />
    </div>
    {error && <span className="text-xs text-destructive mt-1">{error}</span>}
  </div>
));

Input.displayName = 'Input';

Input.propTypes = {
  error: PropTypes.string,
  icon: PropTypes.node,
  className: PropTypes.string,
};

export default Input; 