import React from 'react';
import { performSignOut, forceSignOut } from '@/shared/utils/signOut';

export const TestSignOut: React.FC = () => {
  const handleSignOut = async () => {
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('Testing sign out...');
    await performSignOut();
  };

  const handleForceSignOut = () => {
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('Testing force sign out...');
    forceSignOut();
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-semibold">Test Sign Out</h2>
      <div className="space-y-2">
        <button
          onClick={handleSignOut}
          className="px-4 py-2 bg-red-500 text-white rounded hover: bg-red-600"
        >
          Test Sign Out (Comprehensive)
        </button>
        <button
          onClick={handleForceSignOut}
          className="px-4 py-2 bg-red-700 text-white rounded hover: bg-red-800"
        >
          Test Force Sign Out
        </button>
      </div>
    </div>
  );
}; 