import React from 'react';
import { Button } from '@/shared/components/ui/Button.tsx';
import { Badge } from '@/shared/components/ui/Badge.tsx';
import { Brain, Users, Settings, Sparkles } from 'lucide-react';
import type { Agent } from '@/services/ai/agentRegistry';

interface AgentPickerProps {
  agents: Agent[];
  selectedAgentId: string;
  onAgentChange: (agentId: string) => void;
  className?: string;
}

export const AgentPicker: React.FC<AgentPickerProps> = ({
  agents,
  selectedAgentId,
  onAgentChange,
  className = ''
}) => {
  const getAgentIcon = (type: Agent['type']) => {
    switch (type) {
      case 'executive':
        return <Brain className="h-4 w-4" />;
      case 'analyst':
        return <Users className="h-4 w-4" />;
      case 'assistant':
        return <Settings className="h-4 w-4" />;
      case 'specialist':
        return <Sparkles className="h-4 w-4" />;
      default:
        return <Brain className="h-4 w-4" />;
    }
  };

  const getAgentBadgeVariant = (type: Agent['type']) => {
    switch (type) {
      case 'executive':
        return 'default';
      case 'analyst':
        return 'secondary';
      case 'assistant':
        return 'outline';
      case 'specialist':
        return 'destructive';
      default:
        return 'default';
    }
  };

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {agents.map((agent) => (
        <Button
          key={agent.id}
          variant={selectedAgentId === agent.id ? 'default' : 'outline'}
          size="sm"
          onClick={() => onAgentChange(agent.id)}
          className="flex items-center space-x-2"
        >
          {getAgentIcon(agent.type)}
          <span>{agent.name}</span>
          <Badge variant={getAgentBadgeVariant(agent.type)} className="ml-1">
            {agent.type}
          </Badge>
        </Button>
      ))}
    </div>
  );
}; 