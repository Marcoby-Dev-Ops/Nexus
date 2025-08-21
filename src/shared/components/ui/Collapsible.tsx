import React, { createContext, useContext, useState } from 'react';
import { cn } from '@/shared/utils/styles';

interface CollapsibleContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CollapsibleContext = createContext<CollapsibleContextValue | undefined>(undefined);

export interface CollapsibleProps {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
}

export interface CollapsibleTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  asChild?: boolean;
}

export interface CollapsibleContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

/**
 * @name Collapsible
 * @description A collapsible container component
 */
export const Collapsible: React.FC<CollapsibleProps> = ({
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange,
  children,
  className,
}) => {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  
  const handleOpenChange = (newOpen: boolean) => {
    if (controlledOpen === undefined) {
      setInternalOpen(newOpen);
    }
    onOpenChange?.(newOpen);
  };

  return (
    <CollapsibleContext.Provider value={{ open, onOpenChange: handleOpenChange }}>
      <div className={cn("w-full", className)}>
        {children}
      </div>
    </CollapsibleContext.Provider>
  );
};

/**
 * @name CollapsibleTrigger
 * @description A trigger button for the collapsible content
 */
export const CollapsibleTrigger: React.FC<CollapsibleTriggerProps> = ({ 
  children, 
  className, 
  asChild = false,
  ...props 
}) => {
  const context = useContext(CollapsibleContext);
  if (!context) {
    throw new Error('CollapsibleTrigger must be used within Collapsible');
  }

  const handleClick = () => {
    context.onOpenChange(!context.open);
  };

  if (asChild) {
    return React.cloneElement(children as React.ReactElement, {
      onClick: handleClick,
      ...props,
    });
  }

  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  );
};

/**
 * @name CollapsibleContent
 * @description The collapsible content container
 */
export const CollapsibleContent: React.FC<CollapsibleContentProps> = ({ 
  children, 
  className, 
  ...props 
}) => {
  const context = useContext(CollapsibleContext);
  if (!context) {
    throw new Error('CollapsibleContent must be used within Collapsible');
  }

  if (!context.open) {
    return null;
  }

  return (
    <div
      className={cn(
        "overflow-hidden transition-all duration-300 ease-in-out",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default Collapsible;
