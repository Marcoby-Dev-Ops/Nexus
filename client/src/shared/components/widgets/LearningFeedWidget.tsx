import React from 'react';

export interface LearningFeedWidgetProps {
  className?: string;
}

/**
 * LearningFeedWidget
 * Displays the learning feed for the dashboard.
 */
const LearningFeedWidget: React.FC<LearningFeedWidgetProps> = ({ className = '' }) => (
  <section
    className={`rounded-lg bg-white dark: bg-gray-900 shadow p-4 ${className}`}
    aria-label="Learning Feed"
  >
    <h3 className="text-lg font-semibold mb-2">Learning Feed</h3>
    <p className="text-gray-500 dark:text-gray-300">Your learning feed will appear here.</p>
  </section>
);

export { LearningFeedWidget };

export default LearningFeedWidget; 
