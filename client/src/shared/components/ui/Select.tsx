import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

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
        'flex h-10 w-full items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-sm',
        'placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50 transition-colors',
        'hover:bg-muted/50',
        className
      )}
    >
      {children}
      <ChevronDown className={cn('h-4 w-4 opacity-50 transition-transform duration-200', isOpen && 'rotate-180')} />
    </button>
  );
};

/**
 * Select value display
 */
export const SelectValue: React.FC<SelectValueProps> = ({ placeholder }) => {
  const { value, options } = React.useContext(SelectContext);
  
  // If we have a value, try to get the display from options
  // If options[value] exists, use it; otherwise, return the value as-is
  const getDisplayValue = () => {
    if (!value) return undefined;
    
    // First try to get from registered options
    if (options[value]) {
      return options[value];
    }
    
    // If no option found, return the value as-is to preserve original formatting
    return value;
  };
  
  const display = getDisplayValue();
  
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
        'absolute top-full z-dropdown mt-1 w-full rounded-md border border-border bg-popover text-popover-foreground shadow-lg',
        'animate-in fade-in-0 zoom-in-95 duration-200',
        'ring-1 ring-black/5 dark:ring-white/10',
        className
      )}
    >
      <div className="p-1">
        {children}
      </div>
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
        'relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm',
        'outline-none transition-colors duration-150',
        'hover:bg-accent hover:text-accent-foreground',
        'focus:bg-accent focus:text-accent-foreground',
        isSelected && 'bg-accent text-accent-foreground',
        className
      )}
    >
      {isSelected && (
        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
          <Check className="h-4 w-4 text-primary" />
        </span>
      )}
      <span className={cn(isSelected && 'ml-6', !isSelected && 'ml-2')}>
        {children}
      </span>
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
    <div className={cn('space-y-1', className)}>
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
    <div className={cn('px-2 py-1.5 text-xs font-semibold text-muted-foreground', className)}>
      {children}
    </div>
  );
};

export default Select; 
