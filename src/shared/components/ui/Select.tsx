import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/shared/utils/styles.ts';

export interface SelectProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  children: React.ReactNode;
}

export interface SelectTriggerProps {
  className?: string;
  children: React.ReactNode;
}

export interface SelectValueProps {
  placeholder?: string;
}

export interface SelectContentProps {
  className?: string;
  children: React.ReactNode;
}

export interface SelectItemProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export interface SelectGroupProps {
  children: React.ReactNode;
  className?: string;
}

export interface SelectLabelProps {
  children: React.ReactNode;
  className?: string;
}

const SelectContext = React.createContext<{
  value?: string;
  onValueChange?: (value: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  disabled?: boolean;
  options: Record<string, string>;
  registerOption: (value: string, label: string) => void;
}>({
  isOpen: false,
  setIsOpen: () => {},
  options: {},
  registerOption: () => {},
});

/**
 * Select component for dropdown selections
 */
export const Select: React.FC<SelectProps> = ({ 
  value, 
  defaultValue,
  onValueChange, 
  disabled = false, 
  children 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<Record<string, string>>({});
  const [internalValue, setInternalValue] = useState(defaultValue);

  const currentValue = value !== undefined ? value: internalValue;

  const handleValueChange = React.useCallback((newValue: string) => {
    if (value === undefined) {
      setInternalValue(newValue);
    }
    onValueChange?.(newValue);
  }, [value, onValueChange]);

  const registerOption = React.useCallback((val: string, label: string) => {
    setOptions(prev => (prev[val] ? prev: { ...prev, [val]: label }));
  }, []);

  return (
    <SelectContext.Provider value={{ 
      value: currentValue, 
      onValueChange: handleValueChange, 
      isOpen, 
      setIsOpen, 
      disabled, 
      options, 
      registerOption 
    }}>
      <div className="relative">
        {children}
      </div>
    </SelectContext.Provider>
  );
};

/**
 * Select trigger button
 */
export const SelectTrigger: React.FC<SelectTriggerProps> = ({ className, children }) => {
  const { isOpen, setIsOpen, disabled } = React.useContext(SelectContext);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, setIsOpen]);

  return (
    <button
      ref={triggerRef}
      type="button"
      onClick={() => !disabled && setIsOpen(!isOpen)}
      disabled={disabled}
      className={cn(
        'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-4 py-4 text-sm',
        'placeholder: text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        'disabled: cursor-not-allowed disabled:opacity-50',
        className
      )}
    >
      {children}
      <ChevronDown className={cn('h-4 w-4 opacity-50 transition-transform', isOpen && 'rotate-180')} />
    </button>
  );
};

/**
 * Select value display
 */
export const SelectValue: React.FC<SelectValueProps> = ({ placeholder }) => {
  const { value, options } = React.useContext(SelectContext);
  const display = value ? (options[value] ?? value) : undefined;
  return (
    <span className={cn(!display && 'text-muted-foreground')}>
      {display || placeholder}
    </span>
  );
};

/**
 * Select dropdown content
 */
export const SelectContent: React.FC<SelectContentProps> = ({ className, children }) => {
  const { isOpen } = React.useContext(SelectContext);

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        'absolute top-full z-dropdown mt-1 w-full rounded-md border bg-popover p-4 text-popover-foreground shadow-md',
        'animate-in fade-in-0 zoom-in-95',
        className
      )}
    >
      {children}
    </div>
  );
};

/**
 * Select item option
 */
export const SelectItem: React.FC<SelectItemProps> = ({ value, children, className }) => {
  const { value: selectedValue, onValueChange, setIsOpen, registerOption } = React.useContext(SelectContext);
  const isSelected = selectedValue === value;

  React.useEffect(() => {
    if (typeof children === 'string') {
      registerOption(value, children);
    }
  }, [children, registerOption, value]);

  return (
    <div
      onMouseDown={(e) => {
        e.preventDefault(); // Prevent focus loss
        onValueChange?.(value);
        setIsOpen(false);
      }}
      className={cn(
        'relative flex w-full cursor-default select-none items-center rounded-sm py-4 pl-8 pr-2 text-sm',
        'outline-none focus: bg-accent focus:text-accent-foreground hover:bg-accent hover:text-accent-foreground',
        'cursor-pointer',
        className
      )}
    >
      {isSelected && (
        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
          <Check className="h-4 w-4" />
        </span>
      )}
      {children}
    </div>
  );
};

/**
 * Select group for organizing options
 */
export const SelectGroup: React.FC<SelectGroupProps> = ({ 
  children, 
  className 
}) => {
  return (
    <div className={cn('space-y-2', className)}>
      {children}
    </div>
  );
};

/**
 * Select label for group headings
 */
export const SelectLabel: React.FC<SelectLabelProps> = ({ 
  children, 
  className 
}) => {
  return (
    <div className={cn('px-2 py-2 text-sm font-semibold', className)}>
      {children}
    </div>
  );
};

export default Select; 