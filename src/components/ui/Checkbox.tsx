/**
 * Checkbox component with proper TypeScript definitions
 * Modern styled checkbox with proper accessibility
 */

import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils/utils';
import { Check } from 'lucide-react';
import PropTypes from 'prop-types';

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onCheckedChange' | 'size'> {
  /**
   * @description Whether the checkbox is checked
   */
  checked?: boolean;
  /**
   * @description Callback fired when the checkbox state changes
   */
  onCheckedChange?: (checked: boolean) => void;
  /**
   * @description Label text for the checkbox
   */
  label?: string;
  /**
   * @description Additional CSS classes
   */
  className?: string;
  /**
   * @description Whether the checkbox is disabled
   */
  disabled?: boolean;
  /**
   * @description Size variant of the checkbox
   */
  size?: 'sm' | 'default' | 'lg';
}

/**
 * @name Checkbox
 * @description A customizable checkbox component with optional label support
 * @param {CheckboxProps} props - The props for the checkbox component
 * @returns {JSX.Element} The rendered checkbox component
 */
const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ 
    className, 
    checked, 
    onCheckedChange, 
    onChange, 
    label, 
    disabled, 
    size = 'default',
    id,
    ...props 
  }, ref) => {
    const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const isChecked = event.target.checked;
      onChange?.(event);
      onCheckedChange?.(isChecked);
    };

    const sizeClasses = {
      sm: 'h-3 w-3',
      default: 'h-4 w-4',
      lg: 'h-5 w-5'
    };

    const checkIconSizes = {
      sm: 10,
      default: 12,
      lg: 16
    };

    const checkboxElement = (
      <div className="relative inline-flex items-center">
        <input
          ref={ref}
          type="checkbox"
          id={checkboxId}
          checked={checked}
          onChange={handleChange}
          disabled={disabled}
          className={cn(
            "peer appearance-none rounded border border-border bg-card transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
            "checked:bg-primary checked:border-blue-600",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "dark:border-gray-600 dark:bg-background dark:checked:bg-primary dark:checked:border-blue-600",
            "hover:border-gray-400 dark:hover:border-gray-500",
            sizeClasses[size],
            className
          )}
          {...props}
        />
        <Check 
          className={cn(
            "absolute left-0 top-0 text-primary-foreground opacity-0 transition-opacity pointer-events-none",
            "peer-checked:opacity-100",
            sizeClasses[size]
          )}
          size={checkIconSizes[size]}
        />
      </div>
    );

    if (label) {
      return (
        <div className="flex items-center space-x-2">
          {checkboxElement}
          <label 
            htmlFor={checkboxId}
            className={cn(
              "text-sm font-medium leading-none cursor-pointer",
              "peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
              "dark:text-foreground"
            )}
          >
            {label}
          </label>
        </div>
      );
    }

    return checkboxElement;
  }
);

Checkbox.displayName = 'Checkbox';

Checkbox.propTypes = {
  checked: PropTypes.bool,
  onCheckedChange: PropTypes.func,
  label: PropTypes.string,
  className: PropTypes.string,
  disabled: PropTypes.bool,
  size: PropTypes.oneOf(['sm', 'default', 'lg']),
  id: PropTypes.string,
};

export { Checkbox }; 