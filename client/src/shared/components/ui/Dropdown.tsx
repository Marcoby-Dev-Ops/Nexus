import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/shared/lib/utils';

export interface DropdownItem {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
}

export interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  className?: string;
  align?: 'left' | 'right';
}

/**
 * Simple dropdown component for 1.0
 */
const Dropdown: React.FC<DropdownProps> = ({ 
  trigger, 
  items, 
  className, 
  align = 'left' 
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

  const handleItemClick = (item: DropdownItem) => {
    if (!item.disabled && item.onClick) {
      item.onClick();
    }
    setIsOpen(false);
  };

  return (
    <div className={cn('relative inline-block', className)} ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {trigger}
      </div>
      
      {isOpen && (
        <div 
          className={cn(
            'absolute z-dropdown mt-1 w-56 rounded-md border border-border bg-popover text-popover-foreground shadow-lg',
            'ring-1 ring-black/5 dark:ring-white/10',
            'animate-in fade-in-0 zoom-in-95 duration-200',
            align === 'right' ? 'right-0' : 'left-0'
          )}
        >
          <div className="p-1">
            {items.map((item, index) => (
              <button
                key={index}
                onClick={() => handleItemClick(item)}
                disabled={item.disabled}
                className={cn(
                  'block w-full px-2 py-2 text-left text-sm rounded-sm transition-colors duration-150',
                  'hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
                  'outline-none',
                  item.disabled
                    ? 'text-muted-foreground cursor-not-allowed opacity-50'
                    : 'text-popover-foreground cursor-pointer'
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dropdown; 
