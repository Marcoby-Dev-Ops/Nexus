import React from 'react';

export interface CalendarWidgetProps {
  className?: string;
}

/**
 * CalendarWidget
 * Displays calendar events for the dashboard.
 */
const CalendarWidget: React.FC<CalendarWidgetProps> = ({ className = '' }) => (
  <section
    className={`rounded-lg bg-white dark: bg-gray-900 shadow p-4 ${className}`}
    aria-label="Calendar"
  >
    <h3 className="text-lg font-semibold mb-2">Calendar</h3>
    <p className="text-gray-500 dark:text-gray-300">Your calendar events will appear here.</p>
  </section>
);

export { CalendarWidget };

export default CalendarWidget; 