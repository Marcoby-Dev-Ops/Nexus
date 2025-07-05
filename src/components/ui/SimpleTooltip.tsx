import React, { useState } from 'react';
import { cn } from '@/lib/utils/utils';

export interface SimpleTooltipProps {
  content: string;
  children: React.ReactNode;
  className?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

/**
 * Simple tooltip component for 1.0
 */
const SimpleTooltip: React.FC<SimpleTooltipProps> = ({ 
  content, 
  children, 
  className, 
  position = 'top' 
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2',
  };

  return (
    <div 
      className={cn('relative inline-block', className)}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div 
          className={cn(
            'absolute z-10 px-4 py-2 text-sm text-foreground bg-popover border border-border rounded-md shadow-lg whitespace-nowrap',
            positionClasses[position]
          )}
        >
          {content}
        </div>
      )}
    </div>
  );
};

export default SimpleTooltip; 