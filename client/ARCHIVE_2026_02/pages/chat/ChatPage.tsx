/**
 * Clean Chat Page
 * 
 * Main chat interface that leverages RAG through Nexus Knowledge domain.
 * Provides access to the Executive Assistant and specialized business agents.
 */


import React from 'react';
import AIChatPage from '@/pages/ai/ChatPage';

// Minimal ChatPage for V1: just a single chat interface, no sidebar, no quick start, no context switching
const ChatPage: React.FC = () => {
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="flex-1 min-h-0 overflow-hidden">
        <AIChatPage />
      </div>
    </div>
  );
};

export default ChatPage;
