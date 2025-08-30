import React from 'react';
import { performSignOut, forceSignOut } from '@/shared/utils/signOut';
import { Button } from '@/shared/components/ui/Button';
import { logger } from '@/shared/utils/logger';

export const TestSignOut: React.FC = () => {
  const handleSignOut = async () => {
    try {
      logger.info('Starting sign out process...');
      await performSignOut();
      logger.info('Sign out completed successfully');
    } catch (error) {
      logger.error('Sign out failed:', error);
    }
  };

  const handleForceSignOut = () => {
    try {
      logger.info('Starting force sign out...');
      forceSignOut();
      logger.info('Force sign out completed');
    } catch (error) {
      logger.error('Force sign out failed:', error);
    }
  };

  const handleClearAllState = () => {
    try {
      logger.info('Clearing all user state...');
      
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
      
      logger.info('All state cleared and page reloaded');
    } catch (error) {
      logger.error('Clear state failed:', error);
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
