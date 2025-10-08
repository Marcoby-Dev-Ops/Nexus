import React from 'react';

export interface StreamingComposerProps {
  className?: string;
}

const StreamingComposer: React.FC<StreamingComposerProps> = ({ className = '' }) => {
  return (
    <div className={`rounded-lg bg-white dark: bg-gray-900 shadow p-4 ${className}`}>
      <h3 className="text-lg font-semibold mb-2">Streaming Composer</h3>
      <div className="text-gray-500 dark:text-gray-300">Chat/AI streaming composer will appear here.</div>
    </div>
  );
};

export default StreamingComposer; 
