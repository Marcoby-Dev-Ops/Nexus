import React from 'react';
import { Badge } from '@/shared/components/ui/Badge.tsx';
import { Target, Activity } from 'lucide-react';

interface DomainAgentIndicatorProps {
  domain: string;
  isActive: boolean;
  className?: string;
}

export const DomainAgentIndicator: React.FC<DomainAgentIndicatorProps> = ({
  domain,
  isActive,
  className = ''
}) => {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Badge variant={isActive ? 'default' : 'outline'} className="flex items-center space-x-1">
        {isActive ? <Activity className="h-3 w-3" /> : <Target className="h-3 w-3" />}
        <span>{domain}</span>
      </Badge>
    </div>
  );
}; 