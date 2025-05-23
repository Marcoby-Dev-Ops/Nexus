import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';

/**
 * @interface TooltipProps
 * @description Props for the Tooltip component.
 */
export interface TooltipProps {
  content: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * @name Tooltip
 * @description A tooltip component for contextual help.
 * @param {TooltipProps} props - The props for the component.
 * @returns {JSX.Element} The rendered Tooltip component.
 */
export const Tooltip: React.FC<TooltipProps> = React.memo(({ content, children, className = '' }) => {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      ref={ref}
    >
      {children}
      {visible && (
        <div className="absolute z-20 px-2 py-1 bg-foreground text-background text-xs rounded shadow-lg left-1/2 -translate-x-1/2 mt-2 whitespace-nowrap" role="tooltip">
          {content}
        </div>
      )}
    </div>
  );
});

Tooltip.displayName = 'Tooltip';

Tooltip.propTypes = {
  content: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

export default Tooltip; 