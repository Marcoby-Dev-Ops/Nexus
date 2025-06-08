import React from 'react';
import { cn, getButtonClasses, buttonVariants, buttonSizes } from '@/lib/styles';
import { Spinner } from './Spinner';
import PropTypes from 'prop-types';

/**
 * @interface ButtonProps
 * @description Props for the Button component.
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof buttonVariants | 'default';
  size?: keyof typeof buttonSizes | 'default';
  isLoading?: boolean;
}

/**
 * @name Button
 * @description A reusable button component with variants and loading state.
 * @param {ButtonProps} props - The props for the component.
 * @returns {JSX.Element} The rendered Button component.
 */
export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  isLoading,
  disabled,
  ...props
}) => {
  // Map 'default' to 'primary' for compatibility
  const mappedVariant = variant === 'default' ? 'primary' : variant as keyof typeof buttonVariants;
  const mappedSize = size === 'default' ? 'md' : size as keyof typeof buttonSizes;
  
  return (
    <button
      className={getButtonClasses(mappedVariant, mappedSize, className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <div className="mr-2">
          <Spinner size={16} className="text-current" />
        </div>
      ) : null}
      {children}
    </button>
  );
};

Button.displayName = 'Button';

Button.propTypes = {
  variant: PropTypes.oneOf(['primary', 'secondary', 'destructive', 'ghost', 'link', 'outline'] as const),
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'icon', 'iconSm', 'iconLg'] as const),
  isLoading: PropTypes.bool,
  disabled: PropTypes.bool,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

export default Button; 