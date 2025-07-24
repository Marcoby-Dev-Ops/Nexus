import React, { createContext, useContext, useState } from 'react';
import { cn } from '@/shared/utils/styles';

interface TabsContextValue {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = createContext<TabsContextValue | undefined>(undefined);

export interface TabsProps {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

export interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
  children: React.ReactNode;
}

export interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  children: React.ReactNode;
}

/**
 * @name Tabs
 * @description A tabs container component
 */
export const Tabs: React.FC<TabsProps> = ({
  defaultValue,
  value: controlledValue,
  onValueChange,
  children,
  className,
}) => {
  const [internalValue, setInternalValue] = useState(defaultValue || '');
  const value = controlledValue !== undefined ? controlledValue: internalValue;
  
  const handleValueChange = (newValue: string) => {
    if (controlledValue === undefined) {
      setInternalValue(newValue);
    }
    onValueChange?.(newValue);
  };

  return (
    <TabsContext.Provider value={{ value, onValueChange: handleValueChange }}>
      <div className={cn("w-full", className)}>
        {children}
      </div>
    </TabsContext.Provider>
  );
};

/**
 * @name TabsList
 * @description A container for tab triggers
 */
export const TabsList: React.FC<TabsListProps> = ({ children, className, ...props }) => {
  return (
    <div
      className={cn(
        "inline-flex items-center justify-start space-x-2 rounded-md bg-muted px-2 py-1 text-muted-foreground",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * @name TabsTrigger
 * @description A tab trigger button
 */
export const TabsTrigger: React.FC<TabsTriggerProps> = ({ 
  value, 
  children, 
  className, 
  ...props 
}) => {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('TabsTrigger must be used within Tabs');
  }

  const isActive = context.value === value;

  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-4 py-2 text-sm font-medium ring-offset-background transition-all focus-visible: outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        isActive
          ? "bg-background text-foreground shadow-sm"
          : "hover: bg-muted hover:text-foreground",
        className
      )}
      onClick={() => context.onValueChange(value)}
      {...props}
    >
      {children}
    </button>
  );
};

/**
 * @name TabsContent
 * @description Tab content container
 */
export const TabsContent: React.FC<TabsContentProps> = ({ 
  value, 
  children, 
  className, 
  ...props 
}) => {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('TabsContent must be used within Tabs');
  }

  if (context.value !== value) {
    return null;
  }

  return (
    <div
      className={cn(
        "mt-2 ring-offset-background focus-visible: outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default Tabs; 