import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/shared/components/ui/Button';
import { MessageSquare } from 'lucide-react';

interface OpenChatButtonProps {
  className?: string;
  label?: string;
  agentId?: string;
}

const OpenChatButton: React.FC<OpenChatButtonProps> = ({ className, label = 'Chat with AI', agentId }) => {
  const navigate = useNavigate();

  const openChat = () => {
    const path = '/chat';
    if (agentId) {
      navigate(`${path}?agent=${encodeURIComponent(agentId)}`);
    } else {
      navigate(path);
    }
  };

  return (
    <Button className={className} onClick={openChat}>
      <MessageSquare className="h-4 w-4 mr-2" />
      {label}
    </Button>
  );
};

export default OpenChatButton;
