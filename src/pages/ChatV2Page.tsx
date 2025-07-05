import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/core/supabase';
import StreamingComposer from '@/components/chat/StreamingComposer';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';

interface ConversationRow { id: string; title: string | null; updated_at: string }

const ChatV2Page: React.FC = () => {
  const enabled = import.meta.env.VITE_CHAT_V2 === '1';
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Fetch recent conversations
  useEffect(() => {
    if (!enabled) return;
    (async () => {
      const { data, error } = await (supabase as any)
        .rpc('conversations_with_messages', { limit_param: 20 });
      if (!error && data) setConversations(data);
    })();
  }, [enabled]);

  const handleNewChat = () => {
    setActiveId(null);
  };

  const handleConversationCreated = (id: string) => {
    setActiveId(id);
    // refresh list
    setConversations(prev => [{ id, title: 'Untitled', updated_at: new Date().toISOString() }, ...prev]);
  };

  if (!enabled) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-muted-foreground text-center">
          Chat v2 is disabled. Set <code>VITE_CHAT_V2=1</code> in your environment to enable the streaming composer.
        </p>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="hidden md:flex md:flex-col w-72 border-r border-border overflow-y-auto">
        <div className="p-4 flex justify-between items-center">
          <h2 className="text-sm font-semibold">Conversations</h2>
          <Button size="sm" onClick={handleNewChat}>New</Button>
        </div>
        <nav className="flex-1">
          {conversations.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveId(c.id)}
              className={`w-full text-left px-4 py-3 text-sm hover:bg-accent/40 ${activeId === c.id ? 'bg-accent/60' : ''}`}
            >
              {c.title || 'Untitled'}
            </button>
          ))}
        </nav>
      </aside>

      {/* Chat Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 overflow-hidden">
        <div className="w-full max-w-2xl h-full flex flex-col">
          <StreamingComposer conversationId={activeId} onConversationId={handleConversationCreated} agentId="executive" />
        </div>
      </main>
    </div>
  );
};

export default ChatV2Page; 