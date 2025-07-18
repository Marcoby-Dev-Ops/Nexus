import React from 'react';
import PropTypes from 'prop-types';
import { cn } from '@/shared/utils/styles';

/**
 * @interface CardProps
 * @description Props for the original Card component.
 * @property {React.ReactNode} header - Optional header content.
 * @property {React.ReactNode} footer - Optional footer content.
 * @property {React.ReactNode} children - Card content.
 * @property {string} className - Additional class names.
 * @property {function} onClick - Optional click handler to make the card interactive.
 * @property {string} ariaLabel - Optional aria-label for accessibility when clickable.
 */
export interface CardProps {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  ariaLabel?: string;
}

/**
 * @name Card (Original implementation)
 * @description Your original Card component - keeps backward compatibility
 */
export const OriginalCard: React.FC<CardProps> = React.memo(({ header, footer, children, className = '', onClick, ariaLabel }) => {
  const interactive = typeof onClick === 'function';
  const base = 'bg-card text-card-foreground rounded-xl shadow p-6';
  const interactiveClasses = interactive
    ? 'hover:bg-primary/5 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-primary cursor-pointer transition-colors transition-shadow outline-none'
    : '';
  return (
    <div
      className={cn(base, interactiveClasses, className)}
      onClick={onClick}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={interactive ? ariaLabel : undefined}
    >
      {header && <div className="mb-2 font-semibold">{header}</div>}
      <div>{children}</div>
      {footer && <div className="mt-2 text-sm text-muted-foreground">{footer}</div>}
    </div>
  );
});

OriginalCard.displayName = 'OriginalCard';

// Modern shadcn-style Card components (used by Nexus Thoughts)
const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className || ''}`}
    {...props}
  />
));
Card.displayName = "Card";

// Shadcn-style Card components for compatibility
const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={`flex flex-col space-y-1.5 p-6 ${className || ''}`}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={`text-lg font-semibold leading-none tracking-tight ${className || ''}`}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={`text-sm text-muted-foreground ${className || ''}`}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={`p-6${className ? ` ${className}` : ''}`} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={`flex items-center p-6${className ? ` ${className}` : ''}`}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

Card.propTypes = {
  header: PropTypes.node,
  footer: PropTypes.node,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  onClick: PropTypes.func,
  ariaLabel: PropTypes.string,
};

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };

// Backward compatibility: allow default import
export default Card; 