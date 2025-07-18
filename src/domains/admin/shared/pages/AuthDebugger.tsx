import React from 'react';

export interface AuthDebuggerProps {
  className?: string;
}

/**
 * AuthDebugger
 * Placeholder for authentication debugging tools.
 */
const AuthDebugger: React.FC<AuthDebuggerProps> = ({ className = '' }) => (
  <section className={`rounded-lg bg-white dark:bg-gray-900 shadow p-4 ${className}`} aria-label="Auth Debugger">
    <h3 className="text-lg font-semibold mb-2">Auth Debugger</h3>
    <p className="text-gray-500 dark:text-gray-300">Authentication debugging tools will appear here.</p>
  </section>
);

export { AuthDebugger };

export default AuthDebugger; 