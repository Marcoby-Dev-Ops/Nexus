import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/core/supabase';
import StreamingComposer from '@/components/chat/StreamingComposer';
import { Button } from '@/components/ui/Button';
import AgentPicker from '@/components/chat/AgentPicker';
import { getAgentsByType } from '@/lib/ai/agentRegistry';
import { MVPScopeIndicator } from '@/components/chat/MVPScopeIndicator';
import { useAuth } from '@/contexts/AuthContext';

interface ConversationRow { id: string; title: string | null; updated_at: string }

const DEFAULT_AGENT_ID = getAgentsByType('executive')[0]?.id ?? 'executive';

const ChatPage: React.FC = () => {
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [agentId, setAgentId] = useState<string>(() => {
    return localStorage.getItem('selectedAgentId') ?? DEFAULT_AGENT_ID;
  });

  useEffect(() => {
    localStorage.setItem('selectedAgentId', agentId);
  }, [agentId]);

  // Fetch recent conversations
  useEffect(() => {
    (async () => {
      const { data, error } = await (supabase as any)
        .rpc('conversations_with_messages', { limit_param: 20 });
      if (!error && data) setConversations(data);
    })();
  }, []);

  const handleNewChat = () => {
    setActiveId(null);
  };

  const handleConversationCreated = (id: string) => {
    setActiveId(id);
    // refresh list
    setConversations(prev => [{ id, title: 'Untitled', updated_at: new Date().toISOString() }, ...prev]);
  };

  return (
    <div className="h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="hidden md:flex md:flex-col w-72 border-r border-border overflow-y-auto">
        <div className="p-4 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-semibold">Conversations</h2>
            <Button size="sm" onClick={handleNewChat}>New</Button>
          </div>
          <AgentPicker value={agentId} onChange={setAgentId} />
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
          {!activeId && (
            <div className="mb-6">
              <MVPScopeIndicator />
            </div>
          )}
          <StreamingComposer
            conversationId={activeId}
            onConversationId={handleConversationCreated}
            agentId={agentId}
          />
        </div>
      </main>
    </div>
  );
};

export default ChatPage; 