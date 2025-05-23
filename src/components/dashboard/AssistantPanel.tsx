import React, { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * @interface AssistantPanelProps
 * @description Props for the AssistantPanel component.
 * @property {boolean} [open] - Whether the panel is open (default: true).
 * @property {() => void} [onClose] - Optional close handler.
 */
export interface AssistantPanelProps {
  open?: boolean;
  onClose?: () => void;
}

/**
 * @name AssistantPanel
 * @description Shell for the chat assistant panel. Fixed to the right, with header, scrollable messages, and input box.
 * @param {AssistantPanelProps} props
 * @returns {JSX.Element}
 */
const AssistantPanel: React.FC<AssistantPanelProps> = React.memo(({ open = true, onClose }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom on open
  useEffect(() => {
    if (open && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  if (!open) return null;

  return (
    <aside
      className={`fixed right-0 top-0 h-full w-full max-w-md bg-card/90 shadow-xl z-50 flex flex-col border-l border-border rounded-l-xl backdrop-blur transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}
      role="dialog"
      aria-modal="true"
      aria-label="AI Assistant Panel"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-background/80 backdrop-blur rounded-tl-xl">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-primary">AI Assistant</span>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">Beta</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-muted hover:bg-accent focus-visible:ring-2 focus-visible:ring-primary transition-colors"
            aria-label="Close chat"
          >
            <svg className="w-5 h-5 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background/80 backdrop-blur">
        {/* Placeholder for messages */}
        <div className="text-muted-foreground text-sm text-center mt-8">How can I help you today?</div>
        <div ref={messagesEndRef} />
      </div>
      {/* Input area */}
      <form className="p-4 border-t border-border bg-background/80 backdrop-blur flex gap-2" onSubmit={e => e.preventDefault()}>
        <input
          ref={inputRef}
          type="text"
          placeholder="Ask a question about your dashboard..."
          className="flex-1 px-3 py-2 rounded border border-border bg-card text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
          autoComplete="off"
          aria-label="Ask a question about your dashboard"
        />
        <button
          type="submit"
          className="px-4 py-2 rounded bg-primary text-primary-foreground font-semibold hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-primary transition-colors"
          aria-label="Send message"
        >
          Send
        </button>
      </form>
    </aside>
  );
});

AssistantPanel.displayName = 'AssistantPanel';

AssistantPanel.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
};

export default AssistantPanel; 