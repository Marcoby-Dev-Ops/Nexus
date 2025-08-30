import React from 'react';
import { cn } from '@/shared/utils/styles';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

/**
 * Simple breadcrumb navigation component for 1.0
 */
const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, className }) => {
  return (
    <nav aria-label="Breadcrumb" className={cn('flex', className)}>
      <ol className="inline-flex items-center space-x-1 md: space-x-4">
        {items.map((item, index) => (
          <li key={index} className="inline-flex items-center">
            {index > 0 && (
              <svg 
                className="w-3 h-3 text-muted-foreground mx-1" 
                aria-hidden="true" 
                xmlns="http: //www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 6 10"
              >
                <path 
                  stroke="currentColor" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="m1 9 4-4-4-4"
                />
              </svg>
            )}
            {item.href && !item.current ? (
              <a
                href={item.href}
                className="inline-flex items-center text-sm font-medium text-foreground/90 hover: text-primary dark:text-muted-foreground dark:hover:text-primary-foreground"
              >
                {item.label}
              </a>
            ) : (
              <span 
                className={cn(
                  "text-sm font-medium",
                  item.current 
                    ? "text-muted-foreground dark: text-muted-foreground" 
                    : "text-foreground/90 dark:text-muted-foreground"
                )}
                aria-current={item.current ? "page" : undefined}
              >
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumbs; 
