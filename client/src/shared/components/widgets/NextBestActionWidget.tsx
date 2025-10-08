import React from 'react';

export interface NextBestActionWidgetProps {
  className?: string;
}

/**
 * NextBestActionWidget
 * Displays next best actions for the dashboard.
 */
const NextBestActionWidget: React.FC<NextBestActionWidgetProps> = ({ className = '' }) => (
  <section
    className={`rounded-lg bg-white dark: bg-gray-900 shadow p-4 ${className}`}
    aria-label="Next Best Action"
  >
    <h3 className="text-lg font-semibold mb-2">Next Best Action</h3>
    <p className="text-gray-500 dark:text-gray-300">Your next best actions will appear here.</p>
  </section>
);

export { NextBestActionWidget };

export default NextBestActionWidget; 
