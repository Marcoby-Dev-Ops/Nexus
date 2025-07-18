import React from 'react';

export interface TasksWidgetProps {
  className?: string;
}

/**
 * TasksWidget
 * Displays user tasks for the dashboard.
 */
const TasksWidget: React.FC<TasksWidgetProps> = ({ className = '' }) => (
  <section
    className={`rounded-lg bg-white dark:bg-gray-900 shadow p-4 ${className}`}
    aria-label="Tasks"
  >
    <h3 className="text-lg font-semibold mb-2">Tasks</h3>
    <p className="text-gray-500 dark:text-gray-300">Your tasks will appear here.</p>
  </section>
);

export { TasksWidget };

export default TasksWidget; 