import React from 'react';
import { Badge } from '@/shared/components/ui/Badge';
import { Card, CardContent } from '@/shared/components/ui/Card';
import { Tooltip } from '@/shared/components/ui/Tooltip';
import { agentRegistry } from '@/domains/ai/lib/agentRegistry';

interface DomainAgentIndicatorProps {
  agentId?: string;
  routing?: {
    agent: string;
    confidence: number;
    reasoning: string;
  };
  domainCapabilities?: {
    tools: string[];
    expertise: string[];
    insights: string[];
  };
  showDetails?: boolean;
}

export const DomainAgentIndicator: React.FC<DomainAgentIndicatorProps> = ({
  agentId,
  routing,
  domainCapabilities,
  showDetails = false
}) => {
  const agent = agentRegistry.find(a => a.id === (routing?.agent || agentId));
  
  if (!agent && !routing) return null;

  const displayAgent = agent || { 
    name: routing?.agent || 'Unknown Agent', 
    avatar: '🤖', 
    department: 'general',
    specialties: []
  };

  const confidence = routing?.confidence || 1.0;
  const confidenceColor = confidence >= 0.8 ? 'bg-success/10 text-success' : 
                         confidence >= 0.6 ? 'bg-warning/10 text-yellow-800' : 
                         'bg-destructive/10 text-destructive';

  return (
    <div className="mb-2 space-y-2">
      {/* Agent Routing Info */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="text-lg">{displayAgent.avatar}</span>
        <span className="font-medium">{displayAgent.name}</span>
        {routing && (
          <>
            <Badge variant="outline" className={`text-xs ${confidenceColor}`}>
              {Math.round(confidence * 100)}% confidence
            </Badge>
                                      {routing.reasoning && (
               <Tooltip content={<p className="max-w-xs">{routing.reasoning}</p>}>
                 <Badge variant="outline" className="text-xs cursor-help">
                   Why this agent?
                 </Badge>
               </Tooltip>
             )}
          </>
        )}
      </div>

      {/* Domain Capabilities (if available and showDetails is true) */}
      {showDetails && domainCapabilities && (
        <Card className="bg-background border-l-4 border-l-blue-500">
          <CardContent className="p-4 space-y-2">
            {domainCapabilities.expertise?.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-foreground/90 mb-1">Expertise Areas:</h4>
                <div className="flex flex-wrap gap-1">
                  {domainCapabilities.expertise.slice(0, 4).map((expertise, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {expertise}
                    </Badge>
                  ))}
                  {domainCapabilities.expertise.length > 4 && (
                    <Badge variant="outline" className="text-xs">
                      +{domainCapabilities.expertise.length - 4} more
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {domainCapabilities.tools?.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-foreground/90 mb-1">Available Tools:</h4>
                <div className="flex flex-wrap gap-1">
                  {domainCapabilities.tools.slice(0, 3).map((tool, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {tool.replace(/_/g, ' ')}
                    </Badge>
                  ))}
                  {domainCapabilities.tools.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{domainCapabilities.tools.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {domainCapabilities.insights?.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-foreground/90 mb-1">Recent Insights:</h4>
                <div className="space-y-1">
                  {domainCapabilities.insights.slice(0, 2).map((insight, idx) => (
                    <p key={idx} className="text-xs text-muted-foreground bg-card p-2 rounded border">
                      {insight}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Agent Specialties (fallback if no domain capabilities) */}
      {!domainCapabilities && agent?.specialties && agent.specialties.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {agent.specialties.slice(0, 3).map((specialty, idx) => (
            <Badge key={idx} variant="secondary" className="text-xs">
              {specialty}
            </Badge>
          ))}
          {agent.specialties.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{agent.specialties.length - 3} more
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};

export default DomainAgentIndicator; 