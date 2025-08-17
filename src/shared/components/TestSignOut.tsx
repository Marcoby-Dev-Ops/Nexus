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

  const handleClearAllState = () => {
    try {
      console.log('Clearing all user state...');
      
      // Clear all localStorage
      localStorage.clear();
      
      // Clear all sessionStorage
      sessionStorage.clear();
      
      // Clear all caches
      if ('caches' in window) {
        caches.keys().then(cacheNames => {
          cacheNames.forEach(cacheName => {
            caches.delete(cacheName);
          });
        });
      }
      
      // Force reload the page
      window.location.reload();
      
      console.log('All state cleared and page reloaded');
    } catch (error) {
      console.error('Clear state failed:', error);
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
        <Button
          variant="outline"
          onClick={handleClearAllState}
          className="w-full bg-red-50 text-red-700 hover:bg-red-100"
        >
          Clear All State & Reload
        </Button>
      </div>
    </div>
  );
}; 