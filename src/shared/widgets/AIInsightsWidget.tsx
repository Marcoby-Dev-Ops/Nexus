import React from 'react';

export interface AIInsightsWidgetProps {
  className?: string;
}

/**
 * AIInsightsWidget
 * Displays AI-powered business insights for the dashboard.
 */
const AIInsightsWidget: React.FC<AIInsightsWidgetProps> = ({ className = '' }) => (
  <section
    className={`rounded-lg bg-white dark:bg-gray-900 shadow p-4 ${className}`}
    aria-label="AI Insights"
  >
    <h3 className="text-lg font-semibold mb-2">AI Insights</h3>
    <p className="text-gray-500 dark:text-gray-300">AI-powered business insights will appear here.</p>
  </section>
);

export { AIInsightsWidget };

export default AIInsightsWidget; 