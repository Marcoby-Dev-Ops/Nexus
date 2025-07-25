import React from 'react';
import { Button } from '@/shared/components/ui/Button.tsx';
import { MessageSquare } from 'lucide-react';

interface QuickChatTriggerProps {
  className?: string;
  onClick?: () => void;
}

export const QuickChatTrigger: React.FC<QuickChatTriggerProps> = ({ 
  className = '',
  onClick
}) => {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      // Default behavior - could navigate to chat or open chat modal
      console.log('Quick chat triggered');
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      className={`flex items-center space-x-2 ${className}`}
      data-quick-chat-trigger
    >
      <MessageSquare className="h-4 w-4" />
      <span>Quick Chat</span>
    </Button>
  );
}; 