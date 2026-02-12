import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface SelectProps {
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    disabled?: boolean;
    children: React.ReactNode;
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
    setIsOpen: () => { },
    options: {},
    registerOption: () => { },
});

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

    const currentValue = value !== undefined ? value : internalValue;

    const handleValueChange = (newValue: string) => {
        if (value === undefined) {
            setInternalValue(newValue);
        }
        onValueChange?.(newValue);
        setIsOpen(false);
    };

    const registerOption = (val: string, label: string) => {
        setOptions(prev => (prev[val] ? prev : { ...prev, [val]: label }));
    };

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

export const SelectTrigger: React.FC<{ className?: string, children: React.ReactNode }> = ({ className, children }) => {
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
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, setIsOpen]);

    return (
        <button
            ref={triggerRef}
            type="button"
            onClick={() => !disabled && setIsOpen(!isOpen)}
            disabled={disabled}
            className={cn(
                'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors',
                className
            )}
        >
            {children}
            <ChevronDown className={cn('h-4 w-4 opacity-50 transition-transform duration-200', isOpen && 'rotate-180')} />
        </button>
    );
};

export const SelectValue: React.FC<{ placeholder?: string }> = ({ placeholder }) => {
    const { value, options } = React.useContext(SelectContext);
    const display = value ? options[value] || value : undefined;
    return <span className={cn(!display && 'text-muted-foreground')}>{display || placeholder}</span>;
};

export const SelectContent: React.FC<{ className?: string, children: React.ReactNode }> = ({ className, children }) => {
    const { isOpen } = React.useContext(SelectContext);
    if (!isOpen) return null;
    return (
        <div className={cn(
            'absolute top-full z-50 mt-1 w-full rounded-md border border-input bg-popover text-popover-foreground shadow-md outline-none animate-in fade-in-0 zoom-in-95',
            className
        )}>
            <div className="p-1">{children}</div>
        </div>
    );
};

export const SelectItem: React.FC<{ value: string, children: React.ReactNode, className?: string }> = ({ value, children, className }) => {
    const { value: selectedValue, onValueChange, registerOption } = React.useContext(SelectContext);
    const isSelected = selectedValue === value;

    useEffect(() => {
        if (typeof children === 'string') registerOption(value, children);
    }, [children, value, registerOption]);

    return (
        <div
            onClick={() => onValueChange?.(value)}
            className={cn(
                'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
                isSelected && 'bg-accent text-accent-foreground',
                className
            )}
        >
            <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                {isSelected && <Check className="h-4 w-4" />}
            </span>
            {children}
        </div>
    );
};
