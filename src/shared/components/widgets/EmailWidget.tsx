import React from 'react';

export interface EmailWidgetProps {
  className?: string;
}

/**
 * EmailWidget
 * Displays recent emails for the dashboard.
 */
const EmailWidget: React.FC<EmailWidgetProps> = ({ className = '' }) => (
  <section
    className={`rounded-lg bg-white dark: bg-gray-900 shadow p-4 ${className}`}
    aria-label="Email"
  >
    <h3 className="text-lg font-semibold mb-2">Email</h3>
    <p className="text-gray-500 dark:text-gray-300">Your recent emails will appear here.</p>
  </section>
);

export { EmailWidget };

export default EmailWidget; 