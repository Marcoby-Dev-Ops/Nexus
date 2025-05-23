import React from 'react';
import PropTypes from 'prop-types';

/**
 * @interface CardProps
 * @description Props for the Card component.
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
 * @name Card
 * @description A container component for grouping content, optionally interactive.
 * @param {CardProps} props - The props for the component.
 * @returns {JSX.Element} The rendered Card component.
 */
export const Card: React.FC<CardProps> = React.memo(({ header, footer, children, className = '', onClick, ariaLabel }) => {
  const interactive = typeof onClick === 'function';
  const base = 'bg-card text-card-foreground rounded-xl shadow p-6';
  const interactiveClasses = interactive
    ? 'hover:bg-primary/5 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-primary cursor-pointer transition-colors transition-shadow outline-none'
    : '';
  return (
    <div
      className={`${base} ${interactiveClasses} ${className}`}
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

Card.displayName = 'Card';

Card.propTypes = {
  header: PropTypes.node,
  footer: PropTypes.node,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  onClick: PropTypes.func,
  ariaLabel: PropTypes.string,
};

export default Card; 