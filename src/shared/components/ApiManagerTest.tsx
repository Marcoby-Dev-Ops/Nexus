import React from 'react';

export const ApiManagerTest: React.FC = () => {
  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">API Manager Status</h2>
      
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          API Manager edge function is deployed and ready for testing.
        </p>
      </div>
    </div>
  );
}; 