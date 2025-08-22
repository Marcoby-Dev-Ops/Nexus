import React from 'react';

export interface QuickActionsWidgetProps {
  className?: string;
}

/**
 * QuickActionsWidget
 * Displays quick actions for the dashboard.
 */
const QuickActionsWidget: React.FC<QuickActionsWidgetProps> = ({ className = '' }) => (
  <section
    className={`rounded-lg bg-white dark: bg-gray-900 shadow p-4 ${className}`}
    aria-label="Quick Actions"
  >
    <h3 className="text-lg font-semibold mb-2">Quick Actions</h3>
    <p className="text-gray-500 dark:text-gray-300">Your quick actions will appear here.</p>
  </section>
);

export { QuickActionsWidget };

export default QuickActionsWidget; 