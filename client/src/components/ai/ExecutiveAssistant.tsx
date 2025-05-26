import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useNavigate, useLocation } from 'react-router-dom';
import { getChatCompletion } from '../../lib/aiService';
import type { ChatMessage } from '../../lib/aiService';
// import { Button, Card, Input } from 'shadcn/ui'; // Uncomment when shadcn/ui is available

/**
 * ExecutiveAssistant
 *
 * Acts as an executive assistant for the organization, providing contextual guidance, navigation, and insights.
 * Integrates with OpenRouter AI service and is ready for RAG context injection.
 * @component
 */
const ExecutiveAssistant: React.FC = () => {
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'assistant' | 'system'; text: string }>>([
    { sender: 'assistant', text: 'Hello! How can I assist you today?' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Ref for the transcript container
  const transcriptRef = useRef<HTMLDivElement>(null);

  /**
   * Maps route pathnames to human-friendly page names
   */
  const routeToPageName: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/sales': 'Sales',
    '/finance': 'Finance',
    '/operations': 'Operations',
    '/marketplace': 'Marketplace',
    '/data-warehouse': 'Data Warehouse',
    '/admin': 'Admin',
    '/': 'Home',
  };
  const currentPageName = routeToPageName[location.pathname] || 'Unknown Page';

  /**
   * System prompt for the executive assistant persona
   */
  const SYSTEM_PROMPT = `
You are Nexus, an executive assistant for business operations.
Your job is to help users navigate the platform, answer business-related questions, and provide insights using available company data.
Always be concise, professional, and context-aware. If you don't know something, ask for clarification or suggest where to find the answer.
`;

  /**
   * Detects user intent for navigation based on keywords.
   * @param {string} text - The user input.
   * @returns {string | null} - The route to navigate to, or null if none.
   */
  const detectNavigationIntent = (text: string): string | null => {
    const lower = text.toLowerCase();
    if (lower.includes('sales')) return '/sales';
    if (lower.includes('finance')) return '/finance';
    if (lower.includes('operation')) return '/operations';
    if (lower.includes('dashboard') || lower.includes('home')) return '/dashboard';
    if (lower.includes('marketplace') || lower.includes('pulse')) return '/marketplace';
    if (lower.includes('data warehouse')) return '/data-warehouse';
    if (lower.includes('admin')) return '/admin';
    return null;
  };

  /**
   * Placeholder for retrieving RAG context from Qdrant/Supabase.
   * @param {string} query - The user query.
   * @returns {Promise<string>} - The context string.
   */
  const fetchRagContext = async (query: string): Promise<string> => {
    // TODO: Integrate with Qdrant/Supabase for context retrieval
    return '';
  };

  // Handle Ctrl+A to select only the transcript
  const handleTranscriptKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.ctrlKey && e.key.toLowerCase() === 'a') {
      e.preventDefault();
      if (transcriptRef.current) {
        const range = document.createRange();
        range.selectNodeContents(transcriptRef.current);
        const selection = window.getSelection();
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }
    }
  };

  // Handles sending a message and navigation if intent is detected
  const handleSend = async () => {
    if (!input.trim()) return;
    setMessages((prev) => [...prev, { sender: 'user', text: input }]);
    setError(null);
    const route = detectNavigationIntent(input);
    if (route) {
      setMessages((prev) => [
        ...prev,
        { sender: 'assistant', text: `Navigating you to the right place...` },
      ]);
      setTimeout(() => navigate(route), 800); // Delay for UX
      setInput('');
      return;
    }
    setLoading(true);
    try {
      // Fetch context for RAG (if needed)
      const ragContext = await fetchRagContext(input);
      // Compose page context
      const pageContext = `Current route: ${location.pathname}\nCurrent page: ${currentPageName}`;
      // Prepare chat history for AI
      const chatMessages: ChatMessage[] = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages.map((m) => ({ role: m.sender as ChatMessage['role'], content: m.text })),
        { role: 'user', content: input },
      ];
      // Inject both page context and RAG context
      const context = [pageContext, ragContext].filter(Boolean).join('\n');
      // Use Mistral model for AI responses
      const aiResponse = await getChatCompletion({ messages: chatMessages, context, model: 'mistralai/mistral-7b-instruct' });
      setMessages((prev) => [
        ...prev,
        { sender: 'assistant', text: aiResponse.content },
      ]);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message || 'Something went wrong.');
      else setError('Something went wrong.');
    } finally {
      setLoading(false);
      setInput('');
    }
  };

  // Quick actions with navigation
  const quickActions = [
    { label: 'View Sales Dashboard', onClick: () => navigate('/sales') },
    { label: 'Show Finance Reports', onClick: () => navigate('/finance') },
    { label: 'Go to Dashboard', onClick: () => navigate('/dashboard') },
    { label: 'Help', onClick: () => setInput('How do I...?') },
  ];

  // Add a system message to the transcript when the route changes
  useEffect(() => {
    const systemMsg = `User navigated to ${currentPageName} page.`;
    setMessages((prev) => {
      // Avoid duplicate system messages for the same page
      if (prev.length > 0 && prev[prev.length - 1].text === systemMsg && prev[prev.length - 1].sender === 'system') {
        return prev;
      }
      return [...prev, { sender: 'system', text: systemMsg }];
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  return (
    <div className="flex flex-col h-full">
      <div
        className="flex-1 overflow-y-auto mb-4 border rounded p-2 bg-gray-50 dark:bg-gray-800"
        tabIndex={0}
        ref={transcriptRef}
        onKeyDown={handleTranscriptKeyDown}
        aria-label="Assistant transcript"
      >
        <div className="flex flex-col gap-2">
          {messages.map((msg, idx) => {
            if (msg.sender === 'system') {
              return (
                <div key={idx} className="text-center text-xs text-gray-400 italic">{msg.text}</div>
              );
            }
            const isUser = msg.sender === 'user';
            return (
              <div
                key={idx}
                className={`flex items-end ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <span className="mr-2 text-blue-500" title="Nexus">🤖</span>
                )}
                <div
                  className={`rounded-lg px-3 py-2 max-w-xs break-words shadow-sm ${
                    isUser
                      ? 'bg-blue-500 text-white self-end'
                      : 'bg-gray-200 text-gray-900 self-start dark:bg-gray-700 dark:text-white'
                  }`}
                >
                  {msg.text}
                </div>
                {isUser && (
                  <span className="ml-2 text-green-500" title="You">🧑‍💻</span>
                )}
              </div>
            );
          })}
        </div>
        {loading && <div className="text-xs text-gray-400">Assistant is typing...</div>}
        {error && <div className="text-xs text-red-500">{error}</div>}
      </div>
      <div className="flex gap-2 mb-2">
        {quickActions.map((action, idx) => (
          <button
            key={idx}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs"
            onClick={action.onClick}
            type="button"
          >
            {action.label}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          className="flex-1 border rounded px-2 py-1 dark:bg-gray-700 dark:text-white"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask me anything..."
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          disabled={loading}
        />
        <button
          className="px-4 py-1 bg-green-500 text-white rounded hover:bg-green-600"
          onClick={handleSend}
          type="button"
          disabled={loading}
        >
          {loading ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
};

ExecutiveAssistant.propTypes = {};

export default ExecutiveAssistant; 