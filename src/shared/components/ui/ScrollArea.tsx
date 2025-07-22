import React from 'react';
import { cn } from '@/shared/lib/utils';

interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  orientation?: 'vertical' | 'horizontal';
  scrollHideDelay?: number;
}

export const ScrollArea: React.FC<ScrollAreaProps> = ({
  children,
  className,
  orientation = 'vertical',
  scrollHideDelay = 600,
  ...props
}) => {
  return (
    <div
      className={cn(
        'relative overflow-auto',
        orientation === 'horizontal' ? 'overflow-x-auto overflow-y-hidden' : 'overflow-y-auto overflow-x-hidden',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default ScrollArea; 