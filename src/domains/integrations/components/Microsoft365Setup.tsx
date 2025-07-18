import React from 'react';

export interface Microsoft365SetupProps {
  className?: string;
}

const Microsoft365Setup: React.FC<Microsoft365SetupProps> = ({ className = '' }) => {
  return (
    <div className={`rounded-lg bg-white dark:bg-gray-900 shadow p-4 ${className}`}>
      <h3 className="text-lg font-semibold mb-2">Microsoft 365 Setup</h3>
      <div className="text-gray-500 dark:text-gray-300">Microsoft 365 integration setup will appear here.</div>
    </div>
  );
};

export default Microsoft365Setup; 