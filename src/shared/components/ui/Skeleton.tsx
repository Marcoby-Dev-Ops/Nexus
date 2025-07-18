import React from 'react';
import clsx from 'clsx';

/**
 * @name Skeleton
 * @description A generic skeleton loading placeholder.
 * @param {object} props
 * @param {string} [props.className] - Additional Tailwind classes for size/shape.
 * @returns {JSX.Element}
 */
const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div
    className={clsx(
      'animate-pulse bg-muted/20 rounded-full',
      className
    )}
    aria-busy="true"
    aria-label="Loading..."
  />
);

export { Skeleton };

export default Skeleton; 