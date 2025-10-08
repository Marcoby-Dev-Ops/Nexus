/**
 * Chat Shortcut Hook
 * 
 * Provides keyboard shortcut (Ctrl/Cmd + K) to quickly access the chat interface.
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const useChatShortcut = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Ctrl/Cmd + K
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        navigate('/chat');
      }
    };

    // Add event listener
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [navigate]);
};
