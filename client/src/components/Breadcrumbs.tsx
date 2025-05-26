import React from 'react';
import PropTypes from 'prop-types';

/**
 * @interface BreadcrumbItem
 * @description Breadcrumb item for the Breadcrumbs component.
 */
export interface BreadcrumbItem {
  label: string;
  href?: string;
}

/**
 * @interface BreadcrumbsProps
 * @description Props for the Breadcrumbs component.
 */
export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

/**
 * @name Breadcrumbs
 * @description A breadcrumbs component for navigation context.
 * @param {BreadcrumbsProps} props - The props for the component.
 * @returns {JSX.Element} The rendered Breadcrumbs component.
 */
export const Breadcrumbs: React.FC<BreadcrumbsProps> = React.memo(({ items, className = '' }) => (
  <nav className={`flex items-center text-sm ${className}`} aria-label="Breadcrumb">
    {items.map((item, idx) => (
      <span key={item.label} className="flex items-center">
        {item.href ? (
          <a href={item.href} className="text-primary hover:underline">{item.label}</a>
        ) : (
          <span className="text-muted-foreground">{item.label}</span>
        )}
        {idx < items.length - 1 && <span className="mx-2 text-muted-foreground">/</span>}
      </span>
    ))}
  </nav>
));

Breadcrumbs.displayName = 'Breadcrumbs';

Breadcrumbs.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      href: PropTypes.string,
    })
  ).isRequired,
  className: PropTypes.string,
};

export default Breadcrumbs; 