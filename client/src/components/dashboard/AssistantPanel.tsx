import React from 'react';
import PropTypes from 'prop-types';
import ExecutiveAssistant from '../ai/ExecutiveAssistant';

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
      {/* Executive Assistant Chat UI */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background/80 backdrop-blur">
        <ExecutiveAssistant />
      </div>
    </aside>
  );
});

AssistantPanel.displayName = 'AssistantPanel';

AssistantPanel.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
};

export default AssistantPanel; 