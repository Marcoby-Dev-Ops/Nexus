import React from 'react';
import { performSignOut, forceSignOut } from '@/shared/utils/signOut';
import { Button } from '@/shared/components/ui/Button';

export const TestSignOut: React.FC = () => {
  const handleSignOut = async () => {
    try {
      console.log('Starting sign out process...');
      await performSignOut();
      console.log('Sign out completed successfully');
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  const handleForceSignOut = () => {
    try {
      console.log('Starting force sign out...');
      forceSignOut();
      console.log('Force sign out completed');
    } catch (error) {
      console.error('Force sign out failed:', error);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-lg font-semibold">Sign Out Test</h3>
      <div className="space-y-2">
        <Button
          variant="destructive"
          onClick={handleSignOut}
          className="w-full"
        >
          Test Normal Sign Out
        </Button>
        <Button
          variant="outline"
          onClick={handleForceSignOut}
          className="w-full"
        >
          Test Force Sign Out
        </Button>
      </div>
    </div>
  );
}; 