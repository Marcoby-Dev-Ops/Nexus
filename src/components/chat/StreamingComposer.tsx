import React, { useState, useRef, useEffect } from 'react';
import type { ComponentProps } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { supabase } from '@/lib/supabase';

const isChatV2Enabled = import.meta.env.VITE_CHAT_V2 === '1';

// Backend Edge Function URL (configure in .env)
const AI_CHAT_FUNC_URL = import.meta.env.VITE_AI_CHAT_URL || '/functions/v1/ai_chat';

type CodeProps = ComponentProps<'code'> & { inline?: boolean; children?: React.ReactNode };

interface StreamingComposerProps {
  conversationId?: string | null;
  onConversationId?: (id: string) => void;
}

export const StreamingComposer: React.FC<StreamingComposerProps> = ({ conversationId: initialId = null, onConversationId }) => {
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(initialId);
  const [streamed, setStreamed] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasFirstChunk, setHasFirstChunk] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const chatRef = useRef<HTMLDivElement | null>(null);
  const [assistantStreamingIndex, setAssistantStreamingIndex] = useState<number | null>(null);

  // Hooks must run unconditionally; determine enabled flag via state constant
  const [enabled] = useState(isChatV2Enabled);

  // Ref for auto-scrolling streamed output
  const previewRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll preview div when streaming
  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  // Load history if an initial conversationId was supplied
  useEffect(() => {
    const loadHistory = async () => {
      if (!initialId) return;
      try {
        const { data, error } = await (supabase as any)
          .from('ai_messages')
          .select('role, content')
          .eq('conversation_id', initialId)
          .order('created_at', { ascending: true });
        if (!error && data) {
          setMessages(data as any);
        }
      } catch (_) {/* ignore */}
    };
    loadHistory();
  }, [initialId]);

  if (!enabled) {
    return null;
  }

  const handleSend = async () => {
    if (!input.trim()) return;
    setError(null);
    setIsStreaming(true);
    setHasFirstChunk(false);

    // optimistic UI: add user message
    setMessages((prev) => [...prev, { role: 'user', content: input.trim() }]);

    // add placeholder assistant message
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);
    const placeholderIndex = messages.length + 1; // after adding user msg and before rendering? We'll compute differently after state update? We'll handle below by capturing index.

    setAssistantStreamingIndex(messages.length + 1);

    const currentMessagesIndex = messages.length + 1;

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const payload: Record<string, any> = {
        message: input,
        metadata: { userId: session?.user?.id },
      };
      if (conversationId) payload.conversationId = conversationId;

      const res = await fetch(`${AI_CHAT_FUNC_URL}?stream=1`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      // Capture conversation ID from response header (first request)
      const headerConvId = res.headers.get('x-conversation-id');
      if (headerConvId && !conversationId) {
        setConversationId(headerConvId);
        onConversationId?.(headerConvId);
      }

      if (!res.ok || !res.body) {
        throw new Error(`Request failed: ${res.status}`);
      }

      setInput(''); // clear input box after sending

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      let done = false;
      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          const chunk = decoder.decode(value);
          if (chunk && !hasFirstChunk) setHasFirstChunk(true);
          // update assistant content
          setMessages((prev) => {
            if (currentMessagesIndex >= prev.length) return prev;
            const updated = [...prev];
            updated[currentMessagesIndex] = {
              ...updated[currentMessagesIndex],
              content: updated[currentMessagesIndex].content + chunk,
            };
            return updated;
          });
        }
      }
    } catch (err: any) {
      console.error('Streaming error', err);
      setError(err.message || 'Streaming error');
    } finally {
      setIsStreaming(false);
      setAssistantStreamingIndex(null);
    }
  };

  const ChatBubble: React.FC<{ role: 'user' | 'assistant'; children: React.ReactNode }> = ({ role, children }) => (
    <div className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[75%] whitespace-pre-wrap break-words px-4 py-2 rounded-2xl text-sm shadow ${
        role === 'user'
          ? 'bg-blue-500 text-white rounded-br-none'
          : 'bg-gray-200 text-gray-900 rounded-bl-none'
      }`}>
        {children}
      </div>
    </div>
  );

  return (
    <div className="streaming-composer flex flex-col h-full max-h-[90vh]">
      {/* chat area */}
      <div ref={chatRef} className="flex-1 overflow-y-auto space-y-2 p-4 border rounded bg-white mb-2">
        {messages.map((m, idx) => (
          <ChatBubble key={idx} role={m.role}>
            {m.role === 'assistant' ? (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                className="prose prose-sm dark:prose-invert max-w-none"
              >
                {m.content || (idx === assistantStreamingIndex && isStreaming ? '…' : '')}
              </ReactMarkdown>
            ) : (
              m.content
            )}
          </ChatBubble>
        ))}
        {/* typing indicator if no first chunk yet */}
        {isStreaming && !hasFirstChunk && (
          <ChatBubble role="assistant">
            <span className="animate-pulse">…</span>
          </ChatBubble>
        )}
      </div>

      {/* input area */}
      <textarea
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder="Type your message..."
        className="w-full p-2 border rounded mb-2"
        rows={2}
        disabled={isStreaming}
      />
      <button className="send-btn mb-2" onClick={handleSend} disabled={!input || isStreaming}>
        {isStreaming ? 'Streaming…' : 'Send'}
      </button>
      {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
    </div>
  );
};

export default StreamingComposer; 