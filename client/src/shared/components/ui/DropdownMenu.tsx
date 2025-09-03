import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/shared/lib/utils';

export interface DropdownMenuTriggerProps {
  children: React.ReactNode;
}

export interface DropdownMenuContentProps {
  children: React.ReactNode;
  className?: string;
  align?: 'start' | 'center' | 'end';
  forceMount?: boolean;
}

export interface DropdownMenuItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export interface DropdownMenuLabelProps {
  children: React.ReactNode;
  className?: string;
}

export interface DropdownMenuSeparatorProps {
  className?: string;
}

export const DropdownMenu: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <div className="relative">{children}</div>;
};

export const DropdownMenuTrigger: React.FC<DropdownMenuTriggerProps> = ({ children }) => {
  return <div className="cursor-pointer">{children}</div>;
};

export const DropdownMenuContent: React.FC<DropdownMenuContentProps> = ({ 
  children, 
  className,
  align = 'start',
  forceMount = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Toggle dropdown when trigger is clicked
  useEffect(() => {
    const trigger = dropdownRef.current?.previousElementSibling;
    if (trigger) {
      const handleTriggerClick = () => setIsOpen(!isOpen);
      trigger.addEventListener('click', handleTriggerClick);
      return () => trigger.removeEventListener('click', handleTriggerClick);
    }
  }, [isOpen]);

  if (!isOpen && !forceMount) return null;

  return (
    <div 
      ref={dropdownRef}
      className={cn(
        'absolute z-dropdown mt-2 w-56 rounded-md border border-border bg-popover text-popover-foreground shadow-lg',
        'ring-1 ring-black/5 dark:ring-white/10',
        'animate-in fade-in-0 zoom-in-95 duration-200',
        align === 'end' ? 'right-0' : align === 'center' ? 'left-1/2 transform -translate-x-1/2' : 'left-0',
        className
      )}
    >
      <div className="p-1">
        {children}
      </div>
    </div>
  );
};

export const DropdownMenuItem: React.FC<DropdownMenuItemProps> = ({ 
  children, 
  onClick,
  disabled = false,
  className
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm',
        'outline-none transition-colors duration-150',
        'hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
        'disabled:pointer-events-none disabled:opacity-50',
        className
      )}
    >
      {children}
    </button>
  );
};

export const DropdownMenuLabel: React.FC<DropdownMenuLabelProps> = ({ 
  children, 
  className 
}) => {
  return (
    <div className={cn('px-2 py-1.5 text-xs font-semibold text-muted-foreground', className)}>
      {children}
    </div>
  );
};

export const DropdownMenuSeparator: React.FC<DropdownMenuSeparatorProps> = ({ 
  className 
}) => {
  return (
    <div className={cn('my-1 h-px bg-border', className)} />
  );
}; 
