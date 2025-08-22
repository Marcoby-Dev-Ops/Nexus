import React from 'react';

export interface IdeasWidgetProps {
  className?: string;
}

/**
 * IdeasWidget
 * Displays captured ideas for the dashboard.
 */
const IdeasWidget: React.FC<IdeasWidgetProps> = ({ className = '' }) => (
  <section
    className={`rounded-lg bg-white dark: bg-gray-900 shadow p-4 ${className}`}
    aria-label="Ideas"
  >
    <h3 className="text-lg font-semibold mb-2">Ideas</h3>
    <p className="text-gray-500 dark:text-gray-300">Your captured ideas will appear here.</p>
  </section>
);

export { IdeasWidget };

export default IdeasWidget; 