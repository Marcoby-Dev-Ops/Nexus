import React from 'react';

export interface NotificationsWidgetProps {
  className?: string;
}

/**
 * NotificationsWidget
 * Displays notifications for the dashboard.
 */
const NotificationsWidget: React.FC<NotificationsWidgetProps> = ({ className = '' }) => (
  <section
    className={`rounded-lg bg-white dark: bg-gray-900 shadow p-4 ${className}`}
    aria-label="Notifications"
  >
    <h3 className="text-lg font-semibold mb-2">Notifications</h3>
    <p className="text-gray-500 dark:text-gray-300">Your notifications will appear here.</p>
  </section>
);

export { NotificationsWidget };

export default NotificationsWidget; 