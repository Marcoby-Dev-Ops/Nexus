import React, { useState, useRef, useEffect } from 'react';
import type { ComponentProps } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { supabase } from '../../lib/core/supabase';
import { env } from '@/lib/core/environment';
import { Card, CardContent } from '@/components/ui/Card';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import SourceChip from './SourceChip';
import SourceDrawer from './SourceDrawer';
import type { SourceMeta } from './SourceDrawer';
import { sendAuditLog } from '@/lib/services/auditLogService';
import { getSlashCommands, filterSlashCommands, type SlashCommand } from '@/lib/services/slashCommandService';
import SlashCommandMenu from './SlashCommandMenu';

// Chat is always enabled; previous VITE_CHAT_V2 gate removed
const isChatEnabled = true;

// Backend Edge Function URL (configure in .env)
// When VITE_EA_CHAT_URL is not explicitly provided, fall back to the Supabase project URL so that
// the path resolves correctly both in local (supabase start → http://localhost:54321) and production.
const AI_CHAT_FUNC_URL = `${env.supabase.url}/functions/v1/ai-rag-assessment-chat`;

type CodeProps = ComponentProps<'code'> & { inline?: boolean; children?: React.ReactNode };

interface StreamingComposerProps {
  conversationId?: string | null;
  onConversationId?: (id: string) => void;
  agentId: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  sources?: SourceMeta[];
}

export const StreamingComposer: React.FC<StreamingComposerProps> = ({ conversationId: initialId = null, onConversationId, agentId }) => {
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(initialId);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasFirstChunk, setHasFirstChunk] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeSource, setActiveSource] = useState<SourceMeta | null>(null);
  const chatRef = useRef<HTMLDivElement | null>(null);
  const [assistantStreamingIndex, setAssistantStreamingIndex] = useState<number | null>(null);

  // Determine enabled flag via constant for future gating if needed
  const enabled = isChatEnabled;

  // Ref for auto-scrolling streamed output (not currently used)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

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

  // Slash-command state -------------------------------------------------------
  const [showCommandMenu, setShowCommandMenu] = useState(false);
  const [commandQuery, setCommandQuery] = useState('');
  const [commandStartIdx, setCommandStartIdx] = useState<number | null>(null);
  const [selectedCmdIdx, setSelectedCmdIdx] = useState(0);
  const [availableCommands, setAvailableCommands] = useState<SlashCommand[]>([]);
  const [commandsLoading, setCommandsLoading] = useState(false);

  // Load slash commands on component mount
  useEffect(() => {
    const loadCommands = async () => {
      setCommandsLoading(true);
      try {
        const commands = await getSlashCommands();
        setAvailableCommands(commands);
      } catch (error) {
        console.error('[StreamingComposer] Failed to load slash commands:', error);
        // Fallback to empty array - the service handles fallbacks internally
        setAvailableCommands([]);
      } finally {
        setCommandsLoading(false);
      }
    };
    loadCommands();
  }, []);

  const filteredCommands = React.useMemo(() => {
    if (!showCommandMenu || commandsLoading) return [] as SlashCommand[];
    return filterSlashCommands(availableCommands, commandQuery);
  }, [commandQuery, showCommandMenu, availableCommands, commandsLoading]);

  if (!enabled) return null;

  const handleSend = async () => {
    if (!input.trim()) return;
    setError(null);
    setIsStreaming(true);

    const userMessage: ChatMessage = { role: 'user', content: input.trim() };
    const newMessages: ChatMessage[] = [...messages, userMessage, { role: 'assistant', content: '' }];
    setMessages(newMessages);

    const assistantMessageIndex = newMessages.length - 1;
    const currentInput = input;
    setInput('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const res = await fetch(AI_CHAT_FUNC_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ query: currentInput }),
      });

      if (!res.ok || !res.body) {
        throw new Error(`Request failed: ${res.status}`);
      }

      sendAuditLog('chat_message_sent', { agentId });

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunk = decoder.decode(value);
        
        // SSE format is `data: {"content": "..."}\n\n`
        const lines = chunk.split('\n\n').filter(line => line.startsWith('data: '));
        for (const line of lines) {
          const jsonString = line.replace('data: ', '');
          const parsed = JSON.parse(jsonString);
          const content = parsed.content;
          
          if (content) {
            setMessages(prev => {
              const updated = [...prev];
              updated[assistantMessageIndex] = {
                ...updated[assistantMessageIndex],
                content: updated[assistantMessageIndex].content + content,
              };
              return updated;
            });
          }
        }
      }
    } catch (err: any) {
      console.error('Streaming error', err);
      const errorMessage = `Error: ${err.message}`;
      setMessages(prev => {
        const updated = [...prev];
        updated[assistantMessageIndex] = { ...updated[assistantMessageIndex], content: errorMessage };
        return updated;
      });
      setError(err.message || 'An error occurred.');
    } finally {
      setIsStreaming(false);
    }
  };

  const ChatBubble: React.FC<{ role: 'user' | 'assistant'; children: React.ReactNode }> = ({ role, children }) => (
    <div className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[75%] whitespace-pre-wrap break-words px-4 py-2 rounded-2xl text-sm shadow ${
        role === 'user'
          ? 'bg-primary text-white rounded-br-none'
          : 'bg-gray-200 text-gray-900 rounded-bl-none'
      }`}>
        {children}
      </div>
    </div>
  );

  return (
    <div className="streaming-composer flex flex-col h-full max-h-[90vh] gap-2 relative">
      <Card className="flex-1 overflow-hidden">
        <CardContent ref={chatRef} className="overflow-y-auto space-y-2 p-4 h-full">
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
              {m.sources && m.sources.length > 0 && (
                <div className="flex gap-1 mt-2">
                  {m.sources.map((s, i) => (
                    <SourceChip key={i} index={i + 1} onClick={() => setActiveSource(s)} />
                  ))}
                </div>
              )}
            </ChatBubble>
          ))}
          {isStreaming && !hasFirstChunk && (
            <ChatBubble role="assistant">
              <span className="animate-pulse">…</span>
            </ChatBubble>
          )}
        </CardContent>
      </Card>

      {/* input area */}
      <Textarea
        ref={textareaRef}
        value={input}
        onChange={e => {
          const value = e.target.value;
          const cursorPos = e.target.selectionStart ?? value.length;

          // Detect the most recent '/'
          const slashIdx = value.lastIndexOf('/', cursorPos - 1);
          if (slashIdx >= 0) {
            const charBefore = slashIdx === 0 ? ' ' : value[slashIdx - 1];
            // Only trigger if slash is at start of line or preceded by whitespace
            if (charBefore === ' ' || charBefore === '\n') {
              const query = value.slice(slashIdx + 1, cursorPos);
              if (/^[\w-]*$/.test(query)) {
                setShowCommandMenu(true);
                setCommandQuery(query);
                setCommandStartIdx(slashIdx);
              } else {
                setShowCommandMenu(false);
              }
            } else {
              setShowCommandMenu(false);
            }
          } else {
            setShowCommandMenu(false);
          }

          setInput(value);
        }}
        onKeyDown={(e) => {
          // When command menu is open, intercept nav keys
          if (showCommandMenu) {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setSelectedCmdIdx((prev) => Math.min(prev + 1, filteredCommands.length - 1));
              return;
            }
            if (e.key === 'ArrowUp') {
              e.preventDefault();
              setSelectedCmdIdx((prev) => Math.max(prev - 1, 0));
              return;
            }
            if (e.key === 'Enter') {
              e.preventDefault();
              if (filteredCommands.length > 0) {
                const cmd = filteredCommands[selectedCmdIdx] ?? filteredCommands[0];
                insertCommand(cmd);
              }
              return;
            }
            if (e.key === 'Escape') {
              e.preventDefault();
              setShowCommandMenu(false);
              return;
            }
          }

          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!isStreaming && input.trim()) {
              handleSend();
            }
          }
        }}
        placeholder="Type your message..."
        rows={2}
        disabled={isStreaming}
      />
      {/* Slash command menu ---------------------------------------------------*/}
      {showCommandMenu && (
        <SlashCommandMenu
          commands={filteredCommands}
          selectedIndex={selectedCmdIdx}
          onSelectCommand={insertCommand}
          onMouseEnter={setSelectedCmdIdx}
          loading={commandsLoading}
          query={commandQuery}
        />
      )}
      <Button onClick={handleSend} disabled={!input || isStreaming} className="self-end">
        {isStreaming ? 'Streaming…' : 'Send'}
      </Button>
      {error && <p className="text-red-600 text-sm mb-2">{error}</p>}

      {/* Source Drawer */}
      <SourceDrawer open={!!activeSource} source={activeSource} onClose={() => setActiveSource(null)} />
    </div>
  );

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  function insertCommand(cmd: SlashCommand) {
    if (commandStartIdx == null) return;
    const textarea = textareaRef.current;
    const cursor = textarea?.selectionStart ?? input.length;
    const before = input.slice(0, commandStartIdx);
    const after = input.slice(cursor);
    const newValue = `${before}/${cmd.slug} ${after}`;
    setInput(newValue);
    // Move caret to after inserted command + space
    requestAnimationFrame(() => {
      const pos = before.length + cmd.slug.length + 2; // '/' + slug + ' '
      textarea?.setSelectionRange(pos, pos);
    });
    setShowCommandMenu(false);
  }
};

export default StreamingComposer; 