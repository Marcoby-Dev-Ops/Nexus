import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { MessageSquare, X, Zap } from 'lucide-react';
import { QuickChat } from './QuickChat';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Floating Quick Chat Trigger Button
 * Can be placed anywhere in your app to provide quick AI assistance
 */
interface QuickChatTriggerProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  theme?: 'default' | 'minimal' | 'vibrant';
  showBadge?: boolean;
  className?: string;
}

export const QuickChatTrigger: React.FC<QuickChatTriggerProps> = ({
  position = 'bottom-right',
  theme = 'default',
  showBadge = true,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const onboardingCompleted = user?.onboardingCompleted ?? false;

  // Hide during onboarding
  if (!onboardingCompleted) {
    return null;
  }

  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6'
  };

  const themeClasses = {
    default: 'bg-primary hover:bg-primary/90 text-primary-foreground',
    minimal: 'bg-background border border-border hover:bg-muted text-foreground',
    vibrant: 'bg-gradient-to-r from-primary to-secondary hover:scale-105 text-primary-foreground'
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (hasUnread) {
      setHasUnread(false);
    }
  };

  const handleExpandToFullChat = () => {
    setIsOpen(false);
    navigate('/chat');
  };

  return (
    <>
      {/* Quick Chat Component */}
      <QuickChat
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onExpandToFullChat={handleExpandToFullChat}
      />

      {/* Floating Action Button */}
      <div className={`fixed z-40 ${positionClasses[position]} ${className}`}>
        <button
          onClick={handleToggle}
          className={`
            relative w-14 h-14 rounded-full shadow-lg transition-all duration-300 
            ${themeClasses[theme]}
            ${isOpen ? 'rotate-180' : 'hover:scale-110'}
            focus:outline-none focus:ring-4 focus:ring-primary/20
          `}
          aria-label={isOpen ? 'Close chat' : 'Open chat'}
        >
          {/* Icon */}
          <div className="flex items-center justify-center">
            {isOpen ? (
              <X className="w-6 h-6" />
            ) : theme === 'vibrant' ? (
              <Zap className="w-6 h-6" />
            ) : (
              <MessageSquare className="w-6 h-6" />
            )}
          </div>

          {/* Notification Badge */}
          {showBadge && hasUnread && !isOpen && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-primary-foreground text-xs rounded-full flex items-center justify-center font-medium">
              !
            </div>
          )}

          {/* Pulse Animation for Attention */}
          {!isOpen && (
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
          )}
        </button>

        {/* Tooltip */}
        {!isOpen && (
          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-background text-primary-foreground text-sm px-4 py-1 rounded-lg whitespace-nowrap">
              Quick AI Help
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
            </div>
          </div>
        )}
      </div>

      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-overlay md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

QuickChatTrigger.propTypes = {
  position: PropTypes.oneOf(['bottom-right', 'bottom-left', 'top-right', 'top-left']),
  theme: PropTypes.oneOf(['default', 'minimal', 'vibrant']),
  showBadge: PropTypes.bool,
  className: PropTypes.string,
};

export default QuickChatTrigger; 