import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/shared/utils/styles';

interface DropdownMenuProps {
  children: React.ReactNode;
}

interface DropdownMenuTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

interface DropdownMenuContentProps {
  children: React.ReactNode;
  className?: string;
  align?: 'start' | 'center' | 'end';
  forceMount?: boolean;
}

interface DropdownMenuItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}

interface DropdownMenuLabelProps {
  children: React.ReactNode;
  className?: string;
}

interface DropdownMenuSeparatorProps {
  className?: string;
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({ children }) => {
  return <div className="relative">{children}</div>;
};

export const DropdownMenuTrigger: React.FC<DropdownMenuTriggerProps> = ({ 
  children, 
  _asChild = false 
}) => {
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
        'absolute z-50 mt-2 w-56 rounded-md bg-card shadow-lg ring-1 ring-black ring-opacity-5',
        align === 'end' ? 'right-0' : align === 'center' ? 'left-1/2 transform -translate-x-1/2' : 'left-0',
        className
      )}
    >
      <div className="py-1">
        {children}
      </div>
    </div>
  );
};

export const DropdownMenuItem: React.FC<DropdownMenuItemProps> = ({ 
  children, 
  onClick,
  disabled = false
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'block w-full px-4 py-2 text-left text-sm',
        disabled
          ? 'text-muted-foreground cursor-not-allowed'
          : 'text-foreground/90 hover:bg-muted hover:text-foreground cursor-pointer'
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
    <div className={cn('px-4 py-2 text-sm font-medium', className)}>
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