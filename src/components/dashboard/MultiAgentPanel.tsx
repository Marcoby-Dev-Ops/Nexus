import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Sparkles, X } from 'lucide-react';
import { OrganizationalChatPanel } from '../ai/OrganizationalChatPanel';

/**
 * @interface MultiAgentPanelProps
 * @description Props for the MultiAgentPanel component.
 * @property {boolean} [open] - Whether the panel is open (default: true).
 * @property {() => void} [onClose] - Optional close handler.
 */
export interface MultiAgentPanelProps {
  open?: boolean;
  onClose?: () => void;
}

/**
 * @name MultiAgentPanel
 * @description Clean, Microsoft Copilot-inspired AI chat panel with organizational hierarchy
 * @param {MultiAgentPanelProps} props
 * @returns {JSX.Element}
 */
const MultiAgentPanel: React.FC<MultiAgentPanelProps> = React.memo(({ open = true, onClose }) => {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [open]);

  if (!open) return null;

  const handleModalScroll = (e: React.UIEvent) => {
    // Prevent scroll events from bubbling to the background page
    e.stopPropagation();
  };

  const handleModalKeyDown = (e: React.KeyboardEvent) => {
    // Prevent keyboard scroll events from bubbling
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'PageUp' || e.key === 'PageDown') {
      e.stopPropagation();
    }
    // Close on Escape key
    if (e.key === 'Escape' && onClose) {
      onClose();
    }
  };

  // Prevent clicks on the modal content from closing the modal
  const handleModalClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <aside
      className={`fixed right-0 top-0 h-full w-full max-w-lg bg-background shadow-2xl z-drawer flex flex-col transition-transform duration-300 ${
        open ? 'translate-x-0' : 'translate-x-full'
      }`}
      role="dialog"
      aria-modal="true"
      aria-label="AI Assistant Panel"
      onScroll={handleModalScroll}
      onKeyDown={handleModalKeyDown}
      onClick={handleModalClick}
      style={{ overscrollBehavior: 'contain' }}
    >
      {/* Clean Header - Copilot Style */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-background">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Nex</h2>
            <p className="text-xs text-muted-foreground">Your business AI assistant</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-4 rounded-lg bg-transparent hover:bg-muted transition-colors group"
            aria-label="Close chat"
          >
            <X className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />
          </button>
        )}
      </div>
      
      {/* Organizational Chat Content */}
      <div className="flex-1 bg-background overflow-auto">
        <OrganizationalChatPanel onClose={onClose} />
      </div>
    </aside>
  );
});

MultiAgentPanel.displayName = 'MultiAgentPanel';

MultiAgentPanel.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
};

export default MultiAgentPanel; 